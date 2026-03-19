import { Ad4mModel, Ad4mClient, Flag, HasMany, HasManyMethods, Link, Literal, Model, Property } from '@coasys/ad4m';
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

  @HasMany(() => ConversationSubgroup)
  subgroupEntities: ConversationSubgroup[] = [];

  async stats(): Promise<{ totalSubgroups: number; participants: string[] }> {
    // find the total subgroup count and the dids of participants in the conversation
    try {
      // Count subgroups by getting all matching URIs and counting them
      const subgroupsQuery = `
        SELECT VALUE out.uri
        FROM link
        WHERE in.uri = '${this.id}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'
      `;

      const subgroupsResult = await this.perspective.querySurrealDB(subgroupsQuery);
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
      const surrealQuery = `
        SELECT
          out.uri AS topicBase,
          fn::parse_literal(out->link[WHERE predicate = 'flux://topic'][0].out.uri) AS topicName
        FROM link
        WHERE predicate = 'flux://has_tag'
          AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_semantic_relationship'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_topic'
          AND (
            in->link[WHERE predicate = 'flux://has_expression'][0].out.uri = '${this.id}'
            OR in->link[WHERE predicate = 'flux://has_expression'][0].out<-link[WHERE predicate = 'ad4m://has_child' AND in.uri = '${this.id}'][0] IS NOT NONE
          )
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const topic of surrealResult || []) {
        if (!uniqueTopics.has(topic.topicBase)) {
          uniqueTopics.set(topic.topicBase, topic);
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
      // Simplified query - get subgroups without timestamps first
      const surrealQuery = `
        SELECT
          out.uri AS id,
          timestamp,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_name'][0].out.uri) AS name,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_summary'][0].out.uri) AS summary
        FROM link
        WHERE in.uri = '${this.id}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'
        ORDER BY timestamp ASC
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // Get timestamps for each subgroup separately
      const subgroups = await Promise.all(
        (surrealResult || []).map(async (subgroup: any) => {
          // Query to get timestamps for items in this subgroup
          // Get creation timestamps from channel→item links, not grouping timestamps from subgroup→item links
          const timestampQuery = `
            SELECT
              (fn::parse_literal(out->link[WHERE predicate = 'flux://transcript_started_at'][0].out.uri) ?? out<-link[WHERE predicate = 'ad4m://has_child' AND in->link[WHERE predicate = 'flux://entry_type' AND out.uri = 'flux://has_channel'][0] IS NOT NONE][0].timestamp) AS channelTimestamp
            FROM link
            WHERE in.uri = '${subgroup.id}'
              AND predicate = 'flux://has_item'
              AND out<-link[WHERE predicate = 'ad4m://has_child' AND in->link[WHERE predicate = 'flux://entry_type' AND out.uri = 'flux://has_channel'][0] IS NOT NONE][0] IS NOT NONE
            ORDER BY channelTimestamp ASC
          `;

          const timestampResults = await this.perspective.querySurrealDB(timestampQuery);

          // Filter out null/undefined timestamps and convert to numeric timestamps
          const timestamps = (timestampResults || [])
            .map((r: any) => r.channelTimestamp)
            .filter((ts) => ts != null && ts !== '') // Remove null/undefined/empty
            .map((ts) => new Date(ts).getTime())
            .filter((time) => !isNaN(time)); // Remove invalid dates (NaN)

          const start = timestamps.length > 0 ? timestamps[0] : 0;
          const end = timestamps.length > 0 ? timestamps[timestamps.length - 1] : 0;

          return {
            id: subgroup.id,
            name: subgroup.name || '',
            summary: subgroup.summary || '',
            start,
            end,
          };
        }),
      );

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
