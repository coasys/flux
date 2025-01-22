import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
import ConversationSubgroup from "../conversation-subgroup";
import { findTopics, getAllTopics } from "@coasys/flux-utils/src/synergy";
import Topic, { TopicWithRelevance } from "../topic";

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
    return await ConversationSubgroup.query(this.perspective, { source: this.baseExpression }) as ConversationSubgroup[];
  }

  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    const subgroups = await this.subgroups();
    const allTopics = await Promise.all(
      subgroups.map(subgroup => subgroup.topicsWithRelevance())
    );
    return allTopics.flat();
  }

  async processNewExpressions(unprocessedItems) {
    // gather up data for LLM processing
    const previousSubgroups = await this.subgroups();
    const lastSubgroup = previousSubgroups[previousSubgroups.length - 1] as any;
    const lastSubgroupTopics = await lastSubgroup?.topicsWithRelevance()
    const lastSubgroupWithTopics = lastSubgroup ? { ...lastSubgroup, topics: lastSubgroupTopics } : null;
    const existingTopics = await Topic.query(this.perspective) as Topic[];

    // run LLM processing
    const { conversationData, currentSubgroup, newSubgroup } = await LLMProcessing(
      unprocessedItems,
      previousSubgroups,
      lastSubgroupWithTopics,
      existingTopics
    );

    // update conversation text
    this.conversationName = conversationData.name;
    this.summary = conversationData.summary;
    await this.update();

    // gather up topics returned from LLM
    //const allReturnedTopics = [];
    //if (currentSubgroup) allReturnedTopics.push(...currentSubgroup.topics);
    //if (newSubgroup) allReturnedTopics.push(...newSubgroup.topics);
    //await Topic.ensureTopics(this.perspective, allReturnedTopics);

    // update currentSubgroup if new data returned from LLM
    if (currentSubgroup) {
      lastSubgroup.subgroupName = currentSubgroup.name;
      lastSubgroup.summary = currentSubgroup.summary;
      for (const topic of currentSubgroup.topics) {
        // skip topics already linked to the subgroup
        if (lastSubgroupTopics.find((t) => t.name === topic.name)) continue;
        await lastSubgroup.addTopicWithRelevance(topic.name, topic.relevance);
      }
    }


    // create new subgroup if returned from LLM
    let newSubgroupEntity;
    if (newSubgroup) {
      newSubgroupEntity = new ConversationSubgroup(this.perspective, undefined, this.baseExpression);
      newSubgroupEntity.subgroupName = newSubgroup.name;
      newSubgroupEntity.summary = newSubgroup.summary;
      await newSubgroupEntity.save();
      newSubgroupEntity = await newSubgroupEntity.get();
      for (const topic of newSubgroup.topics) {
        await newSubgroupEntity.addTopicWithRelevance(topic.name, topic.relevance);
      }
    }

    
    // link items to subgroups
    const indexOfFirstItemInNewSubgroup =
      newSubgroup && unprocessedItems.findIndex((item) => item.baseExpression === newSubgroup.firstItemId);
    for (const [itemIndex, item] of unprocessedItems.entries()) {
      const itemsSubgroup = newSubgroup && itemIndex >= indexOfFirstItemInNewSubgroup ? newSubgroupEntity : lastSubgroup;

      newLinks.push({
        source: itemsSubgroup.baseExpression,
        predicate: "ad4m://has_child",
        target: item.baseExpression,
      });
    }
    // create vector embeddings for each unprocessed item
    await Promise.all(unprocessedItems.map((item) => createEmbedding(perspective, item.text, item.baseExpression)));
    // update vector embedding for conversation
    await removeEmbedding(perspective, conversation.baseExpression);
    await createEmbedding(perspective, conversationData.summary, conversation.baseExpression);
    // update vector embedding for currentSubgroup if returned from LLM
    if (currentSubgroup) {
      await removeEmbedding(perspective, lastSubgroup.baseExpression);
      await createEmbedding(perspective, currentSubgroup.summary, lastSubgroup.baseExpression);
    }
    // create vector embedding for new subgroup if returned from LLM
    if (newSubgroup) await createEmbedding(perspective, newSubgroup.summary, newSubgroupEntity.baseExpression);
    // batch commit all new links (currently only "ad4m://has_child" links)
    await perspective.addLinks(newLinks);
    processing = false;
  }
}
