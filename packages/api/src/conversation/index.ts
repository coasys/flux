import { Ad4mModel, Flag, Link, Literal, ModelOptions, Optional } from "@coasys/ad4m";
import { getProfile, Topic } from "@coasys/flux-api";
import { ProcessingState, Profile } from "@coasys/flux-types";
import { SynergyGroup, SynergyItem, SynergyTopic } from "@coasys/flux-utils";
import ConversationSubgroup from "../conversation-subgroup";
import { ensureLLMTasks, LLMTaskWithExpectedOutputs } from "./LLMutils";
import { createEmbedding, removeEmbedding } from "./util";

@ModelOptions({
  name: "Conversation",
})
export default class Conversation extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    value: "flux://conversation",
  })
  type: string;

  @Optional({
    through: "flux://has_name",
    writable: true,
    resolveLanguage: "literal",
  })
  conversationName: string;

  @Optional({
    through: "flux://has_summary",
    writable: true,
    resolveLanguage: "literal",
  })
  summary: string;

  async stats(): Promise<{ totalSubgroups: number; participants: string[] }> {
    // find the total subgroup count and the dids of participants in the conversation
    try {
      // const prologQuery = `
      //   findall([SubgroupCount, SortedAuthors], (
      //     % 1. Gather all subgroups and find the count
      //     findall(Subgroup, (
      //       subject_class("ConversationSubgroup", CS),
      //       instance(CS, Subgroup),
      //       triple("${this.baseExpression}", "ad4m://has_child", Subgroup)
      //     ), SubgroupList),
      //     length(SubgroupList, SubgroupCount),
      //
      //     % 2. Gather and deduplicate authors
      //     findall(Author, (
      //       member(S, SubgroupList),
      //       triple(S, "ad4m://has_child", Item),
      //       link(_, "ad4m://has_child", Item, _, Author)
      //     ), AuthorList),
      //     sort(AuthorList, SortedAuthors)
      //   ), [Stats]).
      // `;

      // Count subgroups
      const countQuery = `
        SELECT count() AS count
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'
      `;

      // Get unique participants
      const participantsQuery = `
        SELECT VALUE author
        FROM link
        WHERE in->link[WHERE predicate = 'ad4m://has_child' AND in.uri = '${this.baseExpression}'][0] IS NOT NONE
          AND predicate = 'ad4m://has_child'
          AND author IS NOT NONE
      `;

      const [countResult, participantsResult] = await Promise.all([
        this.perspective.querySurrealDB(countQuery),
        this.perspective.querySurrealDB(participantsQuery),
      ]);

      // Sum all count values - SurrealDB may return multiple result rows
      let totalSubgroups = 0;
      for (const result of countResult || []) {
        const countValue = result?.count;
        const count = typeof countValue === 'object' && countValue?.Int !== undefined
          ? countValue.Int
          : (countValue ?? 0);
        totalSubgroups += count;
      }

      const participants: string[] = [...new Set(participantsResult as string[] || [])];
      console.log('*** Conversation.stats() totalSubgroups:', totalSubgroups);
      console.log('*** Conversation.stats() participants:', participants);
      return { totalSubgroups, participants };
    } catch (error) {
      console.error("Error getting conversation stats:", error);
      return { totalSubgroups: 0, participants: [] };
    }
  }

  async topics(): Promise<SynergyTopic[]> {
    // find the conversations topics (via its subgroups)
    try {
      // const prologQuery = `
      //   % Get all topics and sort in one step
      //   findall(TopicList, (
      //     % First get all topic pairs
      //     findall([TopicBase, TopicName], (
      //       % 1. Gather subgroups
      //       findall(Subgroup, (
      //         subject_class("ConversationSubgroup", CS),
      //         instance(CS, Subgroup),
      //         triple("${this.baseExpression}", "ad4m://has_child", Subgroup)
      //       ), SubgroupList),
      //
      //       % 2. Get topics from relationships
      //       member(S, SubgroupList),
      //       subject_class("SemanticRelationship", SR),
      //       instance(SR, Relationship),
      //       triple(Relationship, "flux://has_expression", S),
      //       triple(Relationship, "flux://has_tag", TopicBase),
      //
      //       % 3. Get topic names
      //       subject_class("Topic", T),
      //       instance(T, TopicBase),
      //       property_getter(T, TopicBase, "topic", TopicName)
      //     ), AllTopics),
      //
      //     % Remove duplicates
      //     sort(AllTopics, TopicList)
      //   ), [Topics]).
      // `;

      const surrealQuery = `
        SELECT
          out.uri AS topicBase,
          fn::parse_literal(out->link[WHERE predicate = 'flux://topic'][0].out.uri) AS topicName
        FROM link
        WHERE predicate = 'flux://has_tag'
          AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_semantic_relationship'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_topic'
          AND (
            in->link[WHERE predicate = 'flux://has_expression'][0].out.uri = '${this.baseExpression}'
            OR in->link[WHERE predicate = 'flux://has_expression'][0].out.uri IN (
              SELECT VALUE out.uri
              FROM link
              WHERE in.uri = '${this.baseExpression}'
                AND predicate = 'ad4m://has_child'
            )
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
          baseExpression: topicBase,
          name: topicName,
        })
      );
    } catch (error) {
      console.error("Error getting conversation topics:", error);
      return [];
    }
  }

  async subgroups(): Promise<ConversationSubgroup[]> {
    // find the conversations subgroup entities
    return await ConversationSubgroup.findAll(this.perspective, { source: this.baseExpression });
  }

  async subgroupsData(): Promise<SynergyGroup[]> {
    // find the necissary data to render the conversations subgroups in timeline components (include timestamps for the first and last item in each subgroup)
    try {
      // const prologQuery = `
      //   findall(SubgroupInfo, (
      //     % 1. Identify all subgroups in the conversation
      //     subject_class("ConversationSubgroup", CS),
      //     instance(CS, Subgroup),
      //     triple("${this.baseExpression}", "ad4m://has_child", Subgroup),
      //
      //     % 2. Retrieve subgroup properties
      //     property_getter(CS, Subgroup, "subgroupName", SubgroupName),
      //     (property_getter(CS, Subgroup, "summary", S) -> Summary = S ; Summary = ""),
      //
      //     % 3. Collect timestamps for valid items only
      //     findall(Timestamp, (
      //       triple(Subgroup, "ad4m://has_child", Item),
      //
      //       % Check item is valid type
      //       (
      //         subject_class("Message", MC),
      //         instance(MC, Item)
      //         ;
      //         subject_class("Post", PC),
      //         instance(PC, Item)
      //         ;
      //         subject_class("Task", TC),
      //         instance(TC, Item)
      //       ),
      //
      //       % Get items timestamp from link to channel
      //       link(ChannelId, "ad4m://has_child", Item, Timestamp, _),
      //       subject_class("Channel", CH),
      //       instance(CH, ChannelId)
      //     ), Timestamps),
      //
      //     % 4. Derive start and end from earliest & latest timestamps
      //     (
      //       Timestamps = []
      //       -> StartTime = 0, EndTime = 0
      //       ; sort(Timestamps, Sorted),
      //         Sorted = [StartTime|_],
      //         reverse(Sorted, [EndTime|_])
      //     ),
      //
      //     % 5. Build a single structure for each subgroup
      //     SubgroupInfo = [Subgroup, SubgroupName, Summary, StartTime, EndTime]
      //   ), Subgroups).
      // `;

      // Simplified query - get subgroups without timestamps first
      const surrealQuery = `
        SELECT
          out.uri AS baseExpression,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_name'][0].out.uri) AS name,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_summary'][0].out.uri) AS summary
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // Get timestamps for each subgroup separately
      return await Promise.all(
        (surrealResult || []).map(async (subgroup: any) => {
          // Query to get timestamps for items in this subgroup
          // Using graph traversal from subgroup children that are also channel children
          const timestampQuery = `
            SELECT VALUE timestamp
            FROM link
            WHERE in.uri = '${subgroup.baseExpression}'
              AND predicate = 'ad4m://has_child'
              AND out<-link[WHERE predicate = 'ad4m://has_child' AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_channel'][0] IS NOT NONE
            ORDER BY timestamp ASC
          `;

          const timestamps = await this.perspective.querySurrealDB(timestampQuery);
          const start = timestamps.length > 0 ? new Date(timestamps[0]).getTime() : 0;
          const end = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).getTime() : 0;

          return {
            baseExpression: subgroup.baseExpression,
            name: subgroup.name || "",
            summary: subgroup.summary || "",
            start,
            end,
          };
        })
      );
    } catch (error) {
      console.error("Error getting conversation subgroups:", error);
      return [];
    }
  }

  private async detectNewGroup(
    currentSubgroup: ConversationSubgroup | null,
    unprocessedItems: SynergyItem[]
  ): Promise<{
    group: { n: string; s: string };
    newGroup?: { n: string; s: string; firstItemId: string };
  }> {
    const { grouping } = await ensureLLMTasks(this.perspective.ai);

    const unprocessedItemsWithProfile: (SynergyItem & Profile)[] = await Promise.all(
      unprocessedItems.map(async (item) => ({
        ...item,
        ...(await getProfile(item.author)),
      }))
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
      idToBaseExpression[nextId] = item.baseExpression;
      nextId++;
    }
    const result = await LLMTaskWithExpectedOutputs(
      grouping,
      {
        group: inputGroup,
        unprocessedItems: unprocessedItemsWithProfile.map((item, index) => {
          const text = item.text?.replace(/<[^>]*>/g, "") || "undefined";
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
      this.perspective.ai
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
    isNewGroup?: boolean
  ) {
    const { topics } = await ensureLLMTasks(this.perspective.ai);
    let currentTopics = (await group.topicsWithRelevance()) as any;
    let currentNewTopics = await LLMTaskWithExpectedOutputs(
      topics,
      {
        topics: currentTopics.map((t) => ({ n: t.name, rel: t.relevance })),
        messages: newMessages,
      },
      this.perspective.ai
    );

    const topicMatches = await Topic.findAll(this.perspective, {
      where: { topic: currentNewTopics.map((topic) => Literal.from(topic.n).toUrl()) },
    });
    await Promise.all(
      currentNewTopics.map((topic) => {
        const existingTopic = topicMatches.find((t) => t.topic == Literal.from(topic.n).toUrl());
        group.updateTopicWithRelevance(topic.n, topic.rel, isNewGroup, existingTopic, batchId);
      })
    );
  }

  private async createNewGroup(newGroup: { n: string; s: string }, batchId: string) {
    let newSubgroupEntity = new ConversationSubgroup(this.perspective, undefined, this.baseExpression);
    newSubgroupEntity.subgroupName = newGroup.n;
    newSubgroupEntity.summary = newGroup.s;
    await newSubgroupEntity.save(batchId);
    return newSubgroupEntity;
  }

  async processNewExpressions(
    unprocessedItems: SynergyItem[],
    updateProcessingState: (newState: Partial<ProcessingState> | null) => void
  ) {
    const showLogs = false; // Set to true to enable detailed logging
    const duration = (start, end) => `${((end - start) / 1000).toFixed(1)} secs`;
    const startProcessing = new Date().getTime();

    updateProcessingState({ step: 2 });

    const subgroups = await this.subgroups();
    const currentSubgroup: ConversationSubgroup | null = subgroups.length ? subgroups[subgroups.length - 1] : null;

    unprocessedItems = unprocessedItems.map((item) => {
      if (!item.text) item.text = "";
      return item;
    });
    const batchId = await this.perspective.createBatch();

    // ============== LLM group detection ===============================
    const startGroupTask = new Date().getTime();

    updateProcessingState({ step: 3 });
    // Have LLM sort new messages into old group or detect subject change
    let detectResult = await this.detectNewGroup(currentSubgroup, unprocessedItems);

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
      detectResult.newGroup = { ...detectResult.group, firstItemId: unprocessedItems[0].baseExpression };
      detectResult.group = null;
    }

    // create new subgroup if returned from LLM
    let newSubgroupEntity;
    let indexOfFirstItemInNewSubgroup;
    if (detectResult.newGroup) {
      newSubgroupEntity = await this.createNewGroup(detectResult.newGroup, batchId);
      indexOfFirstItemInNewSubgroup = unprocessedItems.findIndex(
        (item) => item.baseExpression === detectResult.newGroup.firstItemId
      );
    }

    // Sort items into current and/or new group
    const newLinks: Link[] = [];
    const currentNewMessages: string[] = [];
    const newGroupMessages: string[] = [];
    for (const [itemIndex, item] of unprocessedItems.entries()) {
      let itemsSubgroup;
      if ((detectResult.newGroup && itemIndex >= indexOfFirstItemInNewSubgroup) || !currentSubgroup) {
        itemsSubgroup = newSubgroupEntity;
        newGroupMessages.push(item.text);
      } else {
        itemsSubgroup = currentSubgroup;
        currentNewMessages.push(item.text);
      }
      newLinks.push({
        source: itemsSubgroup.baseExpression,
        predicate: "ad4m://has_child",
        target: item.baseExpression,
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
        `🤖 3: LLM conversation updating complete! (${duration(startConversationTask, endConversationTask)})`
      );

    // ------------ saving all new data ------------------

    // Save conversation info
    const start1 = new Date().getTime();
    updateProcessingState({ step: 6 });
    this.conversationName = newConversationInfo.n;
    this.summary = newConversationInfo.s;
    await this.update(batchId);
    const end1 = new Date().getTime();
    if (showLogs) console.log("Conversation info updated: ", duration(start1, end1));

    // Save current group
    if (currentSubgroup) {
      if (showLogs) console.log("Current subgroup updating:", currentSubgroup);
      const start2 = new Date().getTime();
      await currentSubgroup.update(batchId);
      const end2 = new Date().getTime();
      if (showLogs) console.log("Current subgroup info updated: ", duration(start2, end2));
    }

    updateProcessingState({ step: 7 });
    // create vector embeddings for each unprocessed item
    if (showLogs) console.log("Creating vector embeddings for each unprocessed item...", unprocessedItems);
    const start3 = new Date().getTime();
    await Promise.all(
      unprocessedItems.map((item, index) =>
        createEmbedding(this.perspective, item.text, item.baseExpression, this.perspective.ai, batchId, index + 1)
      )
    );
    const end3 = new Date().getTime();
    if (showLogs) console.log("Vector embeddings for each unprocessed item created: ", duration(start3, end3));

    // update vector embedding for conversation
    const start4 = new Date().getTime();
    await removeEmbedding(this.perspective, this.baseExpression, batchId);
    await createEmbedding(this.perspective, this.summary, this.baseExpression, this.perspective.ai, batchId);
    const end4 = new Date().getTime();
    if (showLogs) console.log("Vector embedding for conversation created: ", duration(start4, end4));

    // update vector embedding for currentSubgroup if returned from LLM
    if (currentSubgroup) {
      const start5 = new Date().getTime();
      await removeEmbedding(this.perspective, currentSubgroup.baseExpression, batchId);
      await createEmbedding(
        this.perspective,
        currentSubgroup.summary,
        currentSubgroup.baseExpression,
        this.perspective.ai,
        batchId
      );
      const end5 = new Date().getTime();
      if (showLogs) console.log("Vector embedding for currentSubgroup created: ", duration(start5, end5));
    }
    // create vector embedding for new subgroup if returned from LLM
    if (newSubgroupEntity) {
      const start6 = new Date().getTime();
      await createEmbedding(
        this.perspective,
        newSubgroupEntity.summary,
        newSubgroupEntity.baseExpression,
        this.perspective.ai,
        batchId
      );
      const end6 = new Date().getTime();
      if (showLogs) console.log("Vector embedding for new subgroup created: ", duration(start6, end6));
    }

    // batch commit all new links (currently only "ad4m://has_child" links)
    // i.e. sorting messages into current and/or new sub-group
    const start7 = new Date().getTime();
    await this.perspective.addLinks(newLinks, "shared", batchId);
    const end7 = new Date().getTime();
    if (showLogs) console.log('"ad4m://has_child" links batch commited: ', duration(start7, end7));

    const endProcessing = new Date().getTime();

    updateProcessingState({ step: 8 });

    console.log(`🤖 LLM processing complete in ${duration(startProcessing, endProcessing)}`);
    const startBatchCommit = new Date().getTime();
    if (showLogs) console.log("Committing batch...");
    await this.perspective.commitBatch(batchId);
    const endBatchCommit = new Date().getTime();
    if (showLogs) console.log("Batch committed in: ", duration(startBatchCommit, endBatchCommit));
  }
}
