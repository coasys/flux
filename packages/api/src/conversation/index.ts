import { Link, SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty, Literal } from "@coasys/ad4m";
import ConversationSubgroup from "../conversation-subgroup";
import { ensureLLMTasks, LLMTaskWithExpectedOutputs } from "./LLMutils";
import { createEmbedding, removeEmbedding } from "./util";
import { SynergyTopic, SynergyGroup } from "@coasys/flux-utils";

@SDNAClass({
  name: "Conversation",
})
export default class Conversation extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://conversation",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_name",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  conversationName: string;

  @SubjectProperty({
    through: "flux://has_summary",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  summary: string;

  async stats(): Promise<{ totalSubgroups: number; participants: string[] }> {
    // find the total subgroup count and the dids of participants in the conversation
    try {
      const result = await this.perspective.infer(`
        findall([SubgroupCount, SortedAuthors], (
          % 1. Gather all subgroups and find the count
          findall(Subgroup, (
            subject_class("ConversationSubgroup", CS),
            instance(CS, Subgroup),
            triple("${this.baseExpression}", "ad4m://has_child", Subgroup)
          ), SubgroupList),
          length(SubgroupList, SubgroupCount),
    
          % 2. Gather and deduplicate authors
          findall(Author, (
            member(S, SubgroupList),
            triple(S, "ad4m://has_child", Item),
            link(_, "ad4m://has_child", Item, _, Author)
          ), AuthorList),
          sort(AuthorList, SortedAuthors)
        ), [Stats]).
      `);
      const [totalSubgroups, participants] = result[0]?.Stats ?? [];
      return { totalSubgroups: totalSubgroups ?? 0, participants: participants ?? [] };
    } catch (error) {
      console.error("Error getting conversation stats:", error);
      return { totalSubgroups: 0, participants: [] };
    }
  }

  async topics(): Promise<SynergyTopic[]> {
    // find the conversations topics (via its subgroups)
    try {
      const result = await this.perspective.infer(`
        % Get all topics and sort in one step
        findall(TopicList, (
          % First get all topic pairs
          findall([TopicBase, TopicName], (
            % 1. Gather subgroups
            findall(Subgroup, (
              subject_class("ConversationSubgroup", CS),
              instance(CS, Subgroup),
              triple("${this.baseExpression}", "ad4m://has_child", Subgroup)
            ), SubgroupList),
    
            % 2. Get topics from relationships
            member(S, SubgroupList),
            subject_class("SemanticRelationship", SR),
            instance(SR, Relationship),
            triple(Relationship, "flux://has_expression", S),
            triple(Relationship, "flux://has_tag", TopicBase),
            
            % 3. Get topic names
            subject_class("Topic", T),
            instance(T, TopicBase),
            property_getter(T, TopicBase, "topic", TopicName)
          ), AllTopics),
          
          % Remove duplicates
          sort(AllTopics, TopicList)
        ), [Topics]).
      `);

      return (
        result[0]?.Topics?.map(
          ([baseExpression, name]): SynergyTopic => ({
            baseExpression,
            name: Literal.fromUrl(name).get().data,
          })
        ) || []
      );
    } catch (error) {
      console.error("Error getting conversation topics:", error);
      return [];
    }
  }

  async subgroups(): Promise<ConversationSubgroup[]> {
    // find the conversations subgroup entities
    const subgroups = (await ConversationSubgroup.query(this.perspective, {
      source: this.baseExpression,
    })) as ConversationSubgroup[];
    // sort by timestamp
    return subgroups.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  async subgroupsData(): Promise<SynergyGroup[]> {
    // find the necissary data to render the conversations subgroups in timeline components (include timestamps for the first and last item in each subgroup)
    try {
      const result = await this.perspective.infer(`
        findall(SubgroupInfo, (
          % 1. Identify all subgroups in the conversation
          subject_class("ConversationSubgroup", CS),
          instance(CS, Subgroup),
          triple("${this.baseExpression}", "ad4m://has_child", Subgroup),
      
          % 2. Retrieve subgroup properties
          property_getter(CS, Subgroup, "subgroupName", SubgroupName),
          property_getter(CS, Subgroup, "summary", Summary),
      
          % 3. Collect timestamps for valid items only
          findall(Timestamp, (
            triple(Subgroup, "ad4m://has_child", Item),
            
            % Check item is valid type
            (
              subject_class("Message", MC),
              instance(MC, Item)
              ;
              subject_class("Post", PC),
              instance(PC, Item)
              ;
              subject_class("Task", TC),
              instance(TC, Item)
            ),
            
            % Get items timestamp from link to channel
            link(ChannelId, "ad4m://has_child", Item, Timestamp, _),
            subject_class("Channel", CH),
            instance(CH, ChannelId)
          ), Timestamps),
      
          % 4. Derive start and end from earliest & latest timestamps
          (
            Timestamps = []
            -> StartTime = 0, EndTime = 0
            ; sort(Timestamps, Sorted),
              Sorted = [StartTime|_],
              reverse(Sorted, [EndTime|_])
          ),
      
          % 5. Build a single structure for each subgroup
          SubgroupInfo = [Subgroup, SubgroupName, Summary, StartTime, EndTime]
        ), Subgroups).
      `);

      // convert raw prolog output into a friendlier JS array
      return (result[0]?.Subgroups || []).map(([baseExpression, subgroupName, summary, start, end]) => ({
        baseExpression,
        name: Literal.fromUrl(subgroupName).get().data,
        summary: Literal.fromUrl(summary).get().data,
        start: parseInt(start, 10),
        end: parseInt(end, 10),
      }));
    } catch (error) {
      console.error("Error getting conversation subgroups:", error);
      return [];
    }
  }

  private async detectNewGroup(
    currentSubgroup: ConversationSubgroup | null,
    unprocessedItems: { baseExpression: string; text: string }[]
  ): Promise<{
    group: { n: string; s: string };
    newGroup?: { n: string; s: string; firstItemId: string };
  }> {
    const { grouping } = await ensureLLMTasks(this.perspective.ai);

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
        unprocessedItems: unprocessedItems.map((item, index) => {
          return { id: index, text: item.text.replace(/<[^>]*>/g, "") };
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

  private async updateGroupTopics(group: ConversationSubgroup, newMessages: string[], isNewGroup?: boolean) {
    const { topics } = await ensureLLMTasks(this.perspective.ai);
    let currentTopics = (await group.topicsWithRelevance()) as any;
    let currentNewTopics = await LLMTaskWithExpectedOutputs(
      topics,
      {
        topics: currentTopics.map((t) => {
          return { n: t.name, rel: t.relevance };
        }),
        messages: newMessages,
      },
      this.perspective.ai
    );

    for (const topic of currentNewTopics) {
      await group.updateTopicWithRelevance(topic.n, topic.rel, isNewGroup);
    }
  }

  private async createNewGroup(newGroup: { n: string; s: string }) {
    let newSubgroupEntity = new ConversationSubgroup(this.perspective, undefined, this.baseExpression);
    newSubgroupEntity.subgroupName = newGroup.n;
    newSubgroupEntity.summary = newGroup.s;
    await newSubgroupEntity.save();
    return await newSubgroupEntity.get();
  }

  async processNewExpressions(unprocessedItems) {
    const subgroups = await this.subgroups();
    const currentSubgroup: ConversationSubgroup | null = subgroups.length ? subgroups[subgroups.length - 1] : null;

    // ============== LLM group detection ===============================
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
      detectResult.newGroup = { ...detectResult.group, firstItemId: unprocessedItems[0].id };
      detectResult.group = null;
    }

    // create new subgroup if returned from LLM
    let newSubgroupEntity;
    let indexOfFirstItemInNewSubgroup;
    if (detectResult.newGroup) {
      newSubgroupEntity = await this.createNewGroup(detectResult.newGroup);
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

    // ============== LLM topic list updating ===============================
    // Get update topic lists from LLM and save results
    if (currentSubgroup) await this.updateGroupTopics(currentSubgroup, currentNewMessages);
    if (detectResult.newGroup) await this.updateGroupTopics(newSubgroupEntity, newGroupMessages, true);

    // ============== LLM conversation updating ===============================
    // Gather list of all sub-group name and info as it is now after this processing

    // update current group info in the array
    if (currentSubgroup && detectResult.group) {
      currentSubgroup.subgroupName = detectResult.group.n;
      currentSubgroup.summary = detectResult.group.s;
      subgroups[subgroups.length - 1] = currentSubgroup;
    }

    // create array with property names for the prompt
    const promptArray = subgroups.map((g) => {
      return { n: g.subgroupName, s: g.summary };
    });

    // Add new group if one was detected
    if (detectResult.newGroup) promptArray.push({ n: detectResult.newGroup.n, s: detectResult.newGroup.s });

    const { conversation } = await ensureLLMTasks(this.perspective.ai);
    let newConversationInfo = await LLMTaskWithExpectedOutputs(conversation, promptArray, this.perspective.ai);

    // ------------ saving all new data ------------------

    // Save conversation info
    this.conversationName = newConversationInfo.n;
    this.summary = newConversationInfo.s;
    await this.update();

    // Save current group
    if (currentSubgroup) await currentSubgroup.update();

    // create vector embeddings for each unprocessed item
    await Promise.all(
      unprocessedItems.map((item) =>
        createEmbedding(this.perspective, item.text, item.baseExpression, this.perspective.ai)
      )
    );

    // update vector embedding for conversation
    await removeEmbedding(this.perspective, this.baseExpression);
    await createEmbedding(this.perspective, this.summary, this.baseExpression, this.perspective.ai);

    // update vector embedding for currentSubgroup if returned from LLM
    if (currentSubgroup) {
      await removeEmbedding(this.perspective, currentSubgroup.baseExpression);
      await createEmbedding(
        this.perspective,
        currentSubgroup.summary,
        currentSubgroup.baseExpression,
        this.perspective.ai
      );
    }
    // create vector embedding for new subgroup if returned from LLM
    if (newSubgroupEntity) {
      await createEmbedding(
        this.perspective,
        newSubgroupEntity.summary,
        newSubgroupEntity.baseExpression,
        this.perspective.ai
      );
    }

    // batch commit all new links (currently only "ad4m://has_child" links)
    // i.e. sorting messages into current and/or new sub-group
    await this.perspective.addLinks(newLinks);
  }
}
