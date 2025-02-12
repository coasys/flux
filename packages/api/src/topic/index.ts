import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

export class TopicWithRelevance {
  baseExpression: string;
  name: string;
  relevance: number;
}


@SDNAClass({
  name: "Topic",
})
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

  static async ensureTopics(perspective, topics: string[]): Promise<Topic[]> {
    // Get existing topics
    const existingTopics = await Topic.query(perspective) as Topic[];
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
    return newTopics
  }

  static async byName(perspective, topicName: string): Promise<Topic> {
    const existingTopics = await Topic.query(perspective) as Topic[];
    const existingTopic = existingTopics.find(topic => topic.topic === topicName);
    if (existingTopic) return existingTopic;

    const newTopic = new Topic(perspective);
    newTopic.topic = topicName;
    await newTopic.save();
    return await newTopic.get();
  }
}
