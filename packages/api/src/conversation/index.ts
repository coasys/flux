import { Ad4mModel, Ad4mClient, Flag, HasMany, HasManyMethods, Link, Literal, Model, Property } from '@coasys/ad4m';

import { parseLit } from '../utils/parseLit';
import { getProfile, Topic } from '@coasys/flux-api';
import { ProcessingState, Profile } from '@coasys/flux-types';
import { SynergyGroup, SynergyItem, SynergyTopic } from '@coasys/flux-utils';
import ConversationSubgroup from '../conversation-subgroup';
import { formatTranscriptMarkdown } from './export';
import { ensureLLMTasks, LLMTaskWithExpectedOutputs } from './LLMutils';
import { createEmbedding, removeEmbedding } from './util';
import { community } from '@coasys/flux-constants';
const { FLUX_PARTICIPANT, SUBGROUP_ITEM } = community;

@Model({ name: 'Conversation' })
export class Conversation extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://conversation' })
  type: string;

  @Property({ through: 'flux://has_name' })
  conversationName: string;

  @Property({ through: 'flux://name_is_fixed' })
  nameFixed: boolean = false;

  @Property({ through: 'flux://has_summary' })
  summary: string;

  @HasMany({ through: FLUX_PARTICIPANT })
  participants: string[] = [];

  @HasMany(() => ConversationSubgroup, { through: 'ad4m://has_child' })
  subgroupEntities: ConversationSubgroup[] = [];

  async stats(): Promise<{ totalSubgroups: number; participants: string[] }> {
    // find the total subgroup count and the dids of participants in the conversation
    try {
      // SPARQL migration
      const subgroupsQuery = `
        SELECT ?sg WHERE {
          <${this.id}> <ad4m://has_child> ?sg .
          ?sg <flux://entry_type> <flux://conversation_subgroup> .
        }
      `;

      const subgroupsResult = await this.perspective.querySparql(subgroupsQuery);
      const totalSubgroups = subgroupsResult?.length || 0;

      // Use maintained participants Collection instead of expensive queries
      await this.get();
      return { totalSubgroups, participants: this.participants };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return { totalSubgroups: 0, participants: [] };
    }
  }

  async topics(): Promise<SynergyTopic[]> {
    // find the conversations topics (via its subgroups)
    try {
      // SPARQL migration
      const sparqlQuery = `
        SELECT ?topicBase ?topicNameRaw WHERE {
          ?semRel <flux://has_tag> ?topicBase .
          ?semRel <flux://entry_type> <flux://has_semantic_relationship> .
          ?topicBase <flux://entry_type> <flux://has_topic> .
          ?semRel <flux://has_expression> ?expr .
          {
            FILTER(?expr = <${this.id}>)
          } UNION {
            <${this.id}> <ad4m://has_child> ?expr .
          }
          OPTIONAL { ?topicBase <flux://topic> ?topicNameRaw . }
        }
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const binding of sparqlResult || []) {
        const topicBase = binding.topicBase;
        if (topicBase && !uniqueTopics.has(topicBase)) {
          uniqueTopics.set(topicBase, {
            topicBase,
            topicName: parseLit(binding.topicNameRaw),
          });
        }
      }

      return Array.from(uniqueTopics.values()).map(
        ({ topicBase, topicName }): SynergyTopic => ({
          id: topicBase,
          name: topicName,
        }),
      );
    } catch (error) {
      console.error('Error getting conversation topics:', error);
      return [];
    }
  }

  async subgroups(): Promise<ConversationSubgroup[]> {
    // find the conversations subgroup entities
    await this.get({ subgroupEntities: true });
    return this.subgroupEntities as unknown as ConversationSubgroup[];
  }

  async subgroupsData(): Promise<SynergyGroup[]> {
    // find the necissary data to render the conversations subgroups in timeline components (include timestamps for the first and last item in each subgroup)
    try {
      // SPARQL migration
      const sparqlQuery = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?id ?timestamp ?nameRaw ?summaryRaw WHERE {
          <${this.id}> <ad4m://has_child> ?id .
          ?_reifier rdf:reifies <<( <${this.id}> <ad4m://has_child> ?id )>> .
          ?_reifier <ad4m://ontology/timestamp> ?timestamp .
          ?id <flux://entry_type> <flux://conversation_subgroup> .
          OPTIONAL { ?id <flux://has_name> ?nameRaw . }
          OPTIONAL { ?id <flux://has_summary> ?summaryRaw . }
        }
        ORDER BY ?timestamp
      `;

      const sparqlResult = await this.perspective.querySparql(sparqlQuery);

      // Deduplicate by id
      const subgroupMap = new Map<string, any>();
      for (const binding of sparqlResult || []) {
        const id = binding.id;
        if (id && !subgroupMap.has(id)) {
          subgroupMap.set(id, {
            id,
            timestamp: binding.timestamp,
            name: parseLit(binding.nameRaw),
            summary: parseLit(binding.summaryRaw),
          });
        }
      }

      const subgroupIds = Array.from(subgroupMap.keys());
      if (subgroupIds.length === 0) return [];

      // Batch query: get timestamps for ALL subgroups in a single query
      // instead of one query per subgroup (N+1 → 1)
      const valuesClause = subgroupIds.map(id => `<${id}>`).join(' ');
      const batchTimestampQuery = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?sg ?transcriptStart ?channelTs WHERE {
          VALUES ?sg { ${valuesClause} }
          ?sg <${SUBGROUP_ITEM}> ?item .
          ?chSrc <ad4m://has_child> ?item .
          ?_chReifier rdf:reifies <<( ?chSrc <ad4m://has_child> ?item )>> .
          ?_chReifier <ad4m://ontology/timestamp> ?channelTs .
          ?chSrc <flux://entry_type> <flux://has_channel> .
          OPTIONAL { ?item <flux://transcript_started_at> ?transcriptStart . }
        }
      `;

      const batchResults = await this.perspective.querySparql(batchTimestampQuery);

      // Group timestamps by subgroup ID
      const timestampsBySg = new Map<string, number[]>();
      for (const r of batchResults || []) {
        const sgId = r.sg;
        if (!sgId) continue;
        const ts = parseLit(r.transcriptStart) || r.channelTs;
        if (ts == null || ts === '') continue;
        const time = new Date(ts).getTime();
        if (isNaN(time)) continue;
        if (!timestampsBySg.has(sgId)) timestampsBySg.set(sgId, []);
        timestampsBySg.get(sgId)!.push(time);
      }

      const subgroups = Array.from(subgroupMap.values()).map((subgroup: any) => {
        const timestamps = (timestampsBySg.get(subgroup.id) || []).sort((a, b) => a - b);
        const start = timestamps.length > 0 ? timestamps[0] : 0;
        const end = timestamps.length > 0 ? timestamps[timestamps.length - 1] : 0;

        return {
          id: subgroup.id,
          name: subgroup.name || '',
          summary: subgroup.summary || '',
          timestamp: subgroup.timestamp || '',
          start,
          end,
        };
      });

      // Sort by actual content start time, not link creation time
      return subgroups.sort((a, b) => a.start - b.start);
    } catch (error) {
      console.error('Error getting conversation subgroups:', error);
      return [];
    }
  }

  private async detectNewGroup(
    currentSubgroup: ConversationSubgroup | null,
    unprocessedItems: SynergyItem[],
    client: Ad4mClient,
  ): Promise<{
    group: { n: string; s: string };
    newGroup?: { n: string; s: string; firstItemId: string };
  }> {
    const { grouping } = await ensureLLMTasks(this.perspective.ai);

    const unprocessedItemsWithProfile: (SynergyItem & Profile)[] = await Promise.all(
      unprocessedItems.map(async (item) => ({
        ...item,
        ...(await getProfile(item.author, client)),
      })),
    );

    let inputGroup;
    if (currentSubgroup) {
      inputGroup = {};
      inputGroup.n = currentSubgroup.subgroupName;
      inputGroup.s = currentSubgroup.summary;
    }

    let idToBaseExpression = {};
    let nextId = 0;
    for (const item of unprocessedItems) {
      idToBaseExpression[nextId] = item.id;
      nextId++;
    }
    const result = await LLMTaskWithExpectedOutputs(
      grouping,
      {
        group: inputGroup,
        unprocessedItems: unprocessedItemsWithProfile.map((item, index) => {
          const text = item.text?.replace(/<[^>]*>/g, '') || 'undefined';
          let author = item.givenName;
          if (!author || author.length === 0) {
            author = item.username;
          }
          return {
            id: index,
            author,
            timestamp: item.timestamp,
            text,
          };
        }),
      },
      this.perspective.ai,
    );

    // Error correct firstItemId
    if (result.newGroup) {
      // If we have an empty conversation we always take all messages
      if (!currentSubgroup) result.newGroup.firstItemId = 0;
      else {
        // map index back to item ID
        result.newGroup.firstItemId = idToBaseExpression[result.newGroup.firstItemId];

        // if couldn't find it in map, the LLM might have returned the content of the message
        if (!result.newGroup.firstItemId) {
          result.newGroup.firstItemId = unprocessedItems.findIndex((item) => item.text == result.newGroup.firstItemId);
        }
      }
    }

    return result;
  }

  private async updateGroupTopics(
    group: ConversationSubgroup,
    newMessages: string[],
    batchId: string,
    isNewGroup?: boolean,
  ) {
    const { topics } = await ensureLLMTasks(this.perspective.ai);
    let currentTopics = (await group.topicsWithRelevance()) as any;
    let currentNewTopics = await LLMTaskWithExpectedOutputs(
      topics,
      {
        topics: currentTopics.map((t) => ({ n: t.name, rel: t.relevance })),
        messages: newMessages,
      },
      this.perspective.ai,
    );

    // Filter out topics with empty/null/undefined names to prevent Literal conversion errors
    currentNewTopics = currentNewTopics.filter((topic) => topic.n && topic.n.trim() !== '');

    const topicMatches = await Topic.findAll(this.perspective, {
      where: { topic: currentNewTopics.map((topic) => topic.n) },
    });
    await Promise.all(
      currentNewTopics.map((topic) => {
        const existingTopic = topicMatches.find((t) => t.topic == topic.n);
        return group.updateTopicWithRelevance(topic.n, topic.rel, isNewGroup, existingTopic, batchId);
      }),
    );
  }

  private async createNewGroup(newGroup: { n: string; s: string }, batchId: string) {
    const newSubgroupEntity = await ConversationSubgroup.create(
      this.perspective,
      { subgroupName: newGroup.n, summary: newGroup.s },
      { batchId },
    );
    await this.addSubgroupEntities(newSubgroupEntity, batchId);
    return newSubgroupEntity;
  }

  async processNewExpressions(
    unprocessedItems: SynergyItem[],
    updateProcessingState: (newState: Partial<ProcessingState> | null) => void,
    client: Ad4mClient,
  ) {
    const showLogs = false; // Set to true to enable detailed logging
    const duration = (start, end) => `${((end - start) / 1000).toFixed(1)} secs`;
    const startProcessing = new Date().getTime();

    updateProcessingState({ step: 2 });

    const subgroups = await this.subgroups();
    const currentSubgroup: ConversationSubgroup | null = subgroups.length ? subgroups[subgroups.length - 1] : null;

    unprocessedItems = unprocessedItems.map((item) => {
      if (!item.text) item.text = '';
      return item;
    });
    const batchId = await this.perspective.createBatch();

    // ============== LLM group detection ===============================
    const startGroupTask = new Date().getTime();

    updateProcessingState({ step: 3 });
    // Have LLM sort new messages into old group or detect subject change
    let detectResult = await this.detectNewGroup(currentSubgroup, unprocessedItems, client);

    // Handle case where group is present but properties are not set
    if (detectResult.group && !(detectResult.group.n?.length > 0) && !(detectResult.group.s?.length > 0)) {
      detectResult.group = null;
    }

    // Handle case where newGroup is present but properties are not set
    if (detectResult.newGroup && !(detectResult.newGroup.n?.length > 0) && !(detectResult.newGroup.s?.length > 0)) {
      detectResult.newGroup = null;
    }

    // Handle case where group and newGroup are present but properties are not set

    // Handle case where the conversation is empty (no group yet) but LLM returns data in group and not in newGroup
    if (!currentSubgroup && detectResult.group && !detectResult.newGroup) {
      detectResult.newGroup = { ...detectResult.group, firstItemId: unprocessedItems[0].id };
      detectResult.group = null;
    }

    // create new subgroup if returned from LLM
    let newSubgroupEntity;
    let indexOfFirstItemInNewSubgroup;
    if (detectResult.newGroup) {
      newSubgroupEntity = await this.createNewGroup(detectResult.newGroup, batchId);
      indexOfFirstItemInNewSubgroup = unprocessedItems.findIndex(
        (item) => item.id === detectResult.newGroup.firstItemId,
      );
    }

    // Sort items into current and/or new group
    const newLinks: Link[] = [];
    const currentNewMessages: string[] = [];
    const newGroupMessages: string[] = [];
    const currentSubgroupNewParticipants = new Set<string>();
    const newSubgroupParticipants = new Set<string>();
    const allNewParticipants = new Set<string>();
    for (const [itemIndex, item] of unprocessedItems.entries()) {
      let itemsSubgroup;
      if ((detectResult.newGroup && itemIndex >= indexOfFirstItemInNewSubgroup) || !currentSubgroup) {
        itemsSubgroup = newSubgroupEntity;
        newGroupMessages.push(item.text);
        if (item.author) newSubgroupParticipants.add(item.author);
      } else {
        itemsSubgroup = currentSubgroup;
        currentNewMessages.push(item.text);
        if (item.author) currentSubgroupNewParticipants.add(item.author);
      }
      if (item.author) allNewParticipants.add(item.author);
      newLinks.push({
        source: itemsSubgroup.id,
        predicate: SUBGROUP_ITEM,
        target: item.id,
      });
    }

    const endGroupTask = new Date().getTime();
    if (showLogs) console.log(`🤖 1: LLM group detection complete! (${duration(startGroupTask, endGroupTask)})`);

    // ============== LLM topic list updating ===============================
    const startTopicTask = new Date().getTime();
    updateProcessingState({ step: 4 });
    // Get update topic lists from LLM and save results
    if (currentSubgroup) await this.updateGroupTopics(currentSubgroup, currentNewMessages, batchId);
    if (detectResult.newGroup) await this.updateGroupTopics(newSubgroupEntity, newGroupMessages, batchId, true);

    const endTopicTask = new Date().getTime();
    if (showLogs) console.log(`🤖 2: LLM topic list updating complete! (${duration(startTopicTask, endTopicTask)})`);

    // ============== LLM conversation updating ===============================

    const startConversationTask = new Date().getTime();
    updateProcessingState({ step: 5 });
    // Gather list of all sub-group name and info as it is now after this processing

    // update current group info in the array
    if (currentSubgroup && detectResult.group) {
      currentSubgroup.subgroupName = detectResult.group.n;
      currentSubgroup.summary = detectResult.group.s;
      subgroups[subgroups.length - 1] = currentSubgroup;
    }

    // create array with property names for the prompt
    const promptArray = subgroups.map((g) => ({ n: g.subgroupName, s: g.summary }));

    // Add new group if one was detected
    if (detectResult.newGroup) promptArray.push({ n: detectResult.newGroup.n, s: detectResult.newGroup.s });

    const { conversation } = await ensureLLMTasks(this.perspective.ai);
    let newConversationInfo = await LLMTaskWithExpectedOutputs(conversation, promptArray, this.perspective.ai);

    const endConversationTask = new Date().getTime();
    if (showLogs)
      console.log(
        `🤖 3: LLM conversation updating complete! (${duration(startConversationTask, endConversationTask)})`,
      );

    // ------------ saving all new data ------------------

    // Save conversation info
    const start1 = new Date().getTime();
    updateProcessingState({ step: 6 });
    // Only update name if not manually fixed by user
    if (!this.nameFixed) {
      this.conversationName = newConversationInfo.n;
    }
    this.summary = newConversationInfo.s;

    // Update conversation participants - don't update in-memory array, let it reload from links
    const conversationNewParticipants = Array.from(allNewParticipants).filter(
      (author) => !this.participants.includes(author),
    );
    if (conversationNewParticipants.length > 0) {
      const participantLinks = conversationNewParticipants.map((author) => ({
        source: this.id,
        predicate: 'flux://has_participant',
        target: author,
      }));
      await this.perspective.addLinks(participantLinks, 'shared', batchId);
    }
    await this.save(batchId);
    const end1 = new Date().getTime();
    if (showLogs) console.log('Conversation info updated: ', duration(start1, end1));

    // Save current group
    if (currentSubgroup) {
      if (showLogs) console.log('Current subgroup updating:', currentSubgroup);
      const start2 = new Date().getTime();

      // Update current subgroup participants
      const subgroupNewParticipants = Array.from(currentSubgroupNewParticipants).filter(
        (author) => !currentSubgroup.participants.includes(author),
      );
      if (subgroupNewParticipants.length > 0) {
        const participantLinks = subgroupNewParticipants.map((author) => ({
          source: currentSubgroup.id,
          predicate: 'flux://has_participant',
          target: author,
        }));
        await this.perspective.addLinks(participantLinks, 'shared', batchId);
      }
      await currentSubgroup.save(batchId);
      const end2 = new Date().getTime();
      if (showLogs) console.log('Current subgroup info updated: ', duration(start2, end2));
    }

    // Set new subgroup participants
    if (newSubgroupEntity) {
      const participantLinks = Array.from(newSubgroupParticipants).map((author) => ({
        source: newSubgroupEntity.id,
        predicate: 'flux://has_participant',
        target: author,
      }));
      await this.perspective.addLinks(participantLinks, 'shared', batchId);
    }

    updateProcessingState({ step: 7 });
    // Embedding vector creation gated behind ENABLE_EMBEDDINGS environment variable.
    // Set ENABLE_EMBEDDINGS=true to re-enable. Defaults to off for performance.
    const enableEmbeddings = typeof process !== 'undefined' && process.env?.ENABLE_EMBEDDINGS === 'true';

    if (enableEmbeddings) {
      // create vector embeddings for each unprocessed item
      if (showLogs) console.log('Creating vector embeddings for each unprocessed item...', unprocessedItems);
      const start3 = new Date().getTime();
      await Promise.all(
        unprocessedItems.map((item, index) =>
          createEmbedding(this.perspective, item.text, item.id, this.perspective.ai, batchId, index + 1),
        ),
      );
      const end3 = new Date().getTime();
      if (showLogs) console.log('Vector embeddings for each unprocessed item created: ', duration(start3, end3));

      // update vector embedding for conversation
      const start4 = new Date().getTime();
      await removeEmbedding(this.perspective, this.id, batchId);
      await createEmbedding(this.perspective, this.summary, this.id, this.perspective.ai, batchId);
      const end4 = new Date().getTime();
      if (showLogs) console.log('Vector embedding for conversation created: ', duration(start4, end4));

      // update vector embedding for currentSubgroup if returned from LLM
      if (currentSubgroup) {
        const start5 = new Date().getTime();
        await removeEmbedding(this.perspective, currentSubgroup.id, batchId);
        await createEmbedding(
          this.perspective,
          currentSubgroup.summary,
          currentSubgroup.id,
          this.perspective.ai,
          batchId,
        );
        const end5 = new Date().getTime();
        if (showLogs) console.log('Vector embedding for currentSubgroup created: ', duration(start5, end5));
      }
      // create vector embedding for new subgroup if returned from LLM
      if (newSubgroupEntity) {
        const start6 = new Date().getTime();
        await createEmbedding(
          this.perspective,
          newSubgroupEntity.summary,
          newSubgroupEntity.id,
          this.perspective.ai,
          batchId,
        );
        const end6 = new Date().getTime();
        if (showLogs) console.log('Vector embedding for new subgroup created: ', duration(start6, end6));
      }
    } else if (showLogs) {
      console.log('Embedding vector creation skipped (ENABLE_EMBEDDINGS not set)');
    }

    // batch commit all new links (currently only "flux://has_item" links)
    // i.e. sorting messages into current and/or new sub-group
    const start7 = new Date().getTime();
    await this.perspective.addLinks(newLinks, 'shared', batchId);
    const end7 = new Date().getTime();
    if (showLogs) console.log('"flux://has_item" links batch commited: ', duration(start7, end7));

    const endProcessing = new Date().getTime();

    updateProcessingState({ step: 8 });

    console.log(`🤖 LLM processing complete in ${duration(startProcessing, endProcessing)}`);
    const startBatchCommit = new Date().getTime();
    if (showLogs) console.log('Committing batch...');
    await this.perspective.commitBatch(batchId);
    const endBatchCommit = new Date().getTime();
    if (showLogs) console.log('Batch committed in: ', duration(startBatchCommit, endBatchCommit));
  }

  async exportMarkdown(client: Ad4mClient, unprocessedItems?: SynergyItem[]): Promise<string> {
    await this.get();
    const subgroups = await this.subgroups();
    const topics = await this.topics();

    // Cache profile lookups to avoid redundant calls for repeated authors
    const profileCache = new Map<string, string>();
    const resolveAuthorName = async (did: string): Promise<string> => {
      if (profileCache.has(did)) return profileCache.get(did)!;
      let name: string;
      try {
        const profile = await getProfile(did, client);
        name = profile.givenName || profile.username || did?.slice(0, 16) || 'Unknown';
      } catch {
        name = did?.slice(0, 16) || 'Unknown';
      }
      profileCache.set(did, name);
      return name;
    };

    // Collect all items from all subgroups with author profiles
    const sections: {
      name: string;
      summary: string;
      items: (SynergyItem & { authorName: string })[];
    }[] = [];

    for (const subgroup of subgroups) {
      const items = await subgroup.itemsData();
      const itemsWithNames = await Promise.all(
        items.map(async (item) => ({
          ...item,
          authorName: await resolveAuthorName(item.author),
        })),
      );
      sections.push({
        name: subgroup.subgroupName || '',
        summary: subgroup.summary || '',
        items: itemsWithNames,
      });
    }

    // Sort sections by earliest item timestamp (content time, not link creation time)
    sections.sort((a, b) => {
      const aTime = a.items.length > 0 ? new Date(a.items[0].timestamp).getTime() : 0;
      const bTime = b.items.length > 0 ? new Date(b.items[0].timestamp).getTime() : 0;
      return aTime - bTime;
    });

    // Resolve unprocessed items author names
    let unprocessedWithNames;
    if (unprocessedItems && unprocessedItems.length > 0) {
      unprocessedWithNames = await Promise.all(
        unprocessedItems.map(async (item) => ({
          ...item,
          authorName: await resolveAuthorName(item.author),
        })),
      );
    }

    // Collect unique participant names
    const allParticipants = new Set<string>();
    for (const section of sections) {
      for (const item of section.items) {
        allParticipants.add(item.authorName);
      }
    }
    if (unprocessedWithNames) {
      for (const item of unprocessedWithNames) {
        allParticipants.add(item.authorName);
      }
    }

    return formatTranscriptMarkdown({
      title: this.conversationName || 'Untitled Conversation',
      summary: this.summary || '',
      topics: topics.map((t) => t.name),
      participants: Array.from(allParticipants),
      date: (() => {
        for (const section of sections) {
          if (section.items.length > 0) return section.items[0].timestamp;
        }
        return new Date().toISOString();
      })(),
      sections,
      unprocessedItems: unprocessedWithNames,
    });
  }
}

export interface Conversation extends HasManyMethods<'subgroupEntities' | 'participants'> {}
export default Conversation;
