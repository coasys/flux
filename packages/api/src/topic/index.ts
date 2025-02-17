import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty, Literal } from "@coasys/ad4m";
import { SynergyMatch } from "@coasys/flux-utils";

export class TopicWithRelevance {
  baseExpression: string;
  name: string;
  relevance: number;
}

@SDNAClass({ name: "Topic" })
export default class Topic extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_topic",
  })
  type: string;

  @SubjectProperty({
    through: "flux://topic",
    writable: true,
    resolveLanguage: "literal",
  })
  topic: string;

  private matchQuery(type: "Conversation" | "Subgroup"): string {
    // same prolog query used to find linked conversation & subgroups
    return `
      findall([${type}, Relevance, Channel, ChannelName], (
        % 1. Find SemanticRelationships that have tag = topicId
        subject_class("SemanticRelationship", SR),
        instance(SR, Relationship),
        triple(Relationship, "flux://has_tag", "${this.baseExpression}"),
  
        % 2. Grab the subgroup and relevance
        property_getter(SR, Relationship, "expression", Subgroup),
        property_getter(SR, Relationship, "relevance", Relevance),
  
        % 3. Find the parent Conversation that owns this Subgroup
        subject_class("Conversation", CC),
        instance(CC, Conversation),
        triple(Conversation, "ad4m://has_child", Subgroup),
  
        % 4. Find the Channel that owns this Conversation
        subject_class("Channel", CH),
        instance(CH, Channel),
        triple(Channel, "ad4m://has_child", Conversation),
  
        % 5. Grab the Channel's name property
        property_getter(CH, Channel, "name", ChannelName)
      ), Matches).
    `;
  }

  async linkedConversations(): Promise<SynergyMatch[]> {
    try {
      const result = await this.perspective.infer(this.matchQuery("Conversation"));
      // remove duplicates
      const rows = result[0]?.Matches || [];
      const dedupMap: Record<string, any> = {};
      for (const [baseExpression, relevance, channelId, channelName] of rows) {
        if (!dedupMap[baseExpression]) {
          // convert prolog response to JS
          dedupMap[baseExpression] = {
            baseExpression,
            type: "Conversation",
            relevance: parseInt(Literal.fromUrl(relevance).get().data, 10),
            channelId,
            channelName: Literal.fromUrl(channelName).get().data,
          };
        }
      }
      return Object.values(dedupMap);
    } catch (error) {
      console.error("Error getting linked conversations:", error);
      return [];
    }
  }

  async linkedSubgroups(): Promise<SynergyMatch[]> {
    try {
      const result = await this.perspective.infer(this.matchQuery("Subgroup"));
      return (result[0]?.Matches || []).map(([baseExpression, relevance, channelId, channelName]) => ({
        // convert prolog response to JS
        baseExpression,
        type: "ConversationSubgroup",
        relevance: parseInt(Literal.fromUrl(relevance).get().data, 10),
        channelId,
        channelName: Literal.fromUrl(channelName).get().data,
      }));
    } catch (error) {
      console.error("Error getting linked subgroups:", error);
      return [];
    }
  }

  static async ensureTopics(perspective, topics: string[]): Promise<Topic[]> {
    // Get existing topics
    const existingTopics = (await Topic.query(perspective)) as Topic[];
    const newTopicsToCreate = topics.reduce((acc, topic) => {
      const unique = !acc.some((t) => t.topic === topic) && !existingTopics.some((t) => t.topic === topic);
      if (unique) acc.push(topic);
      return acc;
    }, []);
    // create new topics and store them in newTopics array for later use
    const newTopics: Topic[] = [];
    for (const topic of newTopicsToCreate) {
      // create topic
      const newTopic = new Topic(perspective);
      newTopic.topic = topic;
      await newTopic.save();
      newTopics.push(await newTopic.get());
    }
    return newTopics;
  }

  static async byName(perspective, topicName: string): Promise<Topic> {
    const topicMatches = (await Topic.query(perspective, { where: { name: topicName } })) as Topic[];
    if (topicMatches[0]) return topicMatches[0];

    const newTopic = new Topic(perspective);
    newTopic.topic = topicName;
    await newTopic.save();
    return await newTopic.get();
  }
}
