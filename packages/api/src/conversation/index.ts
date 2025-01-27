import { Link, SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
import ConversationSubgroup from "../conversation-subgroup";
import { TopicWithRelevance } from "../topic";
import { ensureLLMTasks, LLMTaskWithExpectedOutputs } from "./LLMutils";
import { createEmbedding, removeEmbedding } from "./util";

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

  async subgroups(): Promise<ConversationSubgroup[]> {
    const subgroups = await ConversationSubgroup.query(this.perspective, { source: this.baseExpression }) as ConversationSubgroup[];

    // Sort subgroups by timestamp
    const sortedSubgroups = subgroups.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); 
    });

    return sortedSubgroups
  }

  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    const subgroups = await this.subgroups();
    const allTopics = await Promise.all(
      subgroups.map(subgroup => subgroup.topicsWithRelevance())
    );
    return allTopics.flat();
  }

  private async detectNewGroup(
      currentSubgroup: ConversationSubgroup|null, 
      unprocessedItems: { baseExpression: string, text: string}[]
  ): Promise<{
      group: { n: string, s: string }, 
      newGroup?: { n: string, s: string, firstItemId: string}, 
    }> {
    const { grouping } = await ensureLLMTasks(this.perspective.ai);
    return await LLMTaskWithExpectedOutputs(
      grouping, 
      {
        group: currentSubgroup,
        unprocessedItems: unprocessedItems.map((item) => {
          return { id: item.baseExpression, text: item.text.replace(/<[^>]*>/g, '') }
        }),
      },
      this.perspective.ai
    );
  }

  private async updateGroupTopics(group: ConversationSubgroup, newMessages: string[], isNewGroup?: boolean) {
    const { topics } = await ensureLLMTasks(this.perspective.ai);
    let currentTopics = await group.topicsWithRelevance()
    let currentNewTopics = await LLMTaskWithExpectedOutputs(
      topics, 
      {
        topics: currentTopics.map(t => { 
          return { n: t.name, rel: t.relevance }
        }),
        messages: newMessages
      },
      this.perspective.ai
    );

    for (const topic of currentNewTopics) {
      await group.updateTopicWithRelevance(topic.n, topic.rel, isNewGroup);
    }
  }

  private async createNewGroup(newGroup: {n: string, s: string}) {
    let newSubgroupEntity = new ConversationSubgroup(this.perspective, undefined, this.baseExpression);
    newSubgroupEntity.subgroupName = newGroup.n;
    newSubgroupEntity.summary = newGroup.s;
    await newSubgroupEntity.save();
    return await newSubgroupEntity.get();
  }

  async processNewExpressions(unprocessedItems) {
    const subgroups = await this.subgroups();
    const currentSubgroup: ConversationSubgroup|null = subgroups.length ? subgroups[subgroups.length - 1] : null;
  
    // ============== LLM group detection ===============================
    // Have LLM sort new messages into old group or detect subject change
    const { group, newGroup } = await this.detectNewGroup(currentSubgroup, unprocessedItems)

    // create new subgroup if returned from LLM
    let newSubgroupEntity;
    let indexOfFirstItemInNewSubgroup;
    if (newGroup) {
      newSubgroupEntity = await this.createNewGroup(newGroup)
      indexOfFirstItemInNewSubgroup = unprocessedItems.findIndex((item) => item.baseExpression === newGroup.firstItemId);
    }

    // Sort items into current and/or new group
    const newLinks: Link[] = [];
    const currentNewMessages: string[] = [];
    const newGroupMessages: string[] = [];
    for (const [itemIndex, item] of unprocessedItems.entries()) {
      let itemsSubgroup
      if(
          (newGroup && itemIndex >= indexOfFirstItemInNewSubgroup) ||
          !currentSubgroup
       ) {
        itemsSubgroup = newSubgroupEntity
        newGroupMessages.push(item.text)
      } else {
        itemsSubgroup = currentSubgroup
        currentNewMessages.push(item.text)
      }

      newLinks.push({
        source: itemsSubgroup.baseExpression,
        predicate: "ad4m://has_child",
        target: item.baseExpression,
      });
    }

    // ============== LLM topic list updating ===============================
    // Get update topic lists from LLM and save results
    if(currentSubgroup) {
      await this.updateGroupTopics(currentSubgroup, currentNewMessages);
    }
    if(newGroup) {
      await this.updateGroupTopics(newSubgroupEntity, newGroupMessages, true);
    }

    // ============== LLM conversation updating ===============================
    // Gather list of all sub-group name and info as it is now after this processing

    // update current group info in the array
    if(currentSubgroup && group) {
      currentSubgroup.subgroupName = group.n
      currentSubgroup.summary = group.s
      subgroups[subgroups.length-1]=currentSubgroup
    }
    
    // create array with property names for the prompt
    const promptArray = subgroups.map(g => {
      return { n: g.subgroupName, s: g.summary }
    })

    // Add new group if one was detected
    if(newGroup) {
      promptArray.push({n: newGroup.n, s: newGroup.s})
    }

    const { conversation } = await ensureLLMTasks(this.perspective.ai);
    let newConversationInfo = await LLMTaskWithExpectedOutputs(conversation, promptArray, this.perspective.ai);
    
    // ------------ saving all new data ------------------

    // Save conversation info
    this.conversationName = newConversationInfo.n;
    this.summary = newConversationInfo.s;
    await this.update();

    // Save current group
    if(currentSubgroup) {
      await currentSubgroup.update()
    }

    // create vector embeddings for each unprocessed item
    await Promise.all(unprocessedItems.map((item) => createEmbedding(this.perspective, item.text, item.baseExpression, this.perspective.ai)));

    // update vector embedding for conversation
    await removeEmbedding(this.perspective, this.baseExpression);
    await createEmbedding(this.perspective, this.summary, this.baseExpression, this.perspective.ai);

    // update vector embedding for currentSubgroup if returned from LLM
    if (currentSubgroup) {
      await removeEmbedding(this.perspective, currentSubgroup.baseExpression);
      await createEmbedding(this.perspective, currentSubgroup.summary, currentSubgroup.baseExpression, this.perspective.ai);
    }
    // create vector embedding for new subgroup if returned from LLM
    if (newSubgroupEntity) {
      await createEmbedding(this.perspective, newSubgroupEntity.summary, newSubgroupEntity.baseExpression, this.perspective.ai);
    }

    // batch commit all new links (currently only "ad4m://has_child" links)
    // i.e. sorting messages into current and/or new sub-group
    await this.perspective.addLinks(newLinks);
  }
}
