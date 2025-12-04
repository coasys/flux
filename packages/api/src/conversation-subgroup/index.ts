import { ModelOptions, Ad4mModel, Flag, Literal, Optional } from '@coasys/ad4m';
import Topic, { TopicWithRelevance } from '../topic';
import SemanticRelationship from '../semantic-relationship';
import { SynergyTopic, SynergyItem, icons } from '@coasys/flux-utils';

@ModelOptions({
  name: 'ConversationSubgroup',
})
export default class ConversationSubgroup extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://conversation_subgroup',
  })
  type: string;

  @Optional({
    through: 'flux://has_name',
    writable: true,
    resolveLanguage: 'literal',
  })
  subgroupName: string;

  @Optional({
    through: 'flux://has_summary',
    writable: true,
    resolveLanguage: 'literal',
  })
  summary: string;

  async stats(): Promise<{ totalItems: number; participants: string[] }> {
    // find the total item count and the dids of participants in the subgroup
    try {
      // const prologQuery = `
      //   findall([ItemCount, SortedAuthors], (
      //     % 1. Gather all items in the subgroup
      //     findall(Item, (
      //       triple("${this.baseExpression}", "ad4m://has_child", Item),
      //       % Ensure item is not a SemanticRelationship
      //       (
      //         subject_class("Message", MC),
      //         instance(MC, Item)
      //         ;
      //         subject_class("Post", PC),
      //         instance(PC, Item)
      //         ;
      //         subject_class("Task", TC),
      //         instance(TC, Item)
      //       )
      //     ), AllItems),
      //
      //     % 2. Deduplicate items
      //     sort(AllItems, UniqueItems),
      //     length(UniqueItems, ItemCount),
      //
      //     % 3. For each item, gather its authors
      //     findall(Author, (
      //       member(I, UniqueItems),
      //       link(_, "ad4m://has_child", I, _, Author)
      //     ), AuthorList),
      //
      //     % 4. Remove duplicates among authors
      //     sort(AuthorList, SortedAuthors)
      //   ), [Stats]).
      // `;

      // Get items and participants in one query
      const surrealQuery = `
        SELECT VALUE {
          itemUri: out.uri,
          author: author
        }
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
      `;

      // console.log('*** ConversationSubgroup.stats() surrealQuery:', surrealQuery);

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // console.log('*** ConversationSubgroup.stats() surrealResult:', surrealResult);

      const totalItems = surrealResult?.length || 0;
      const participants = [...new Set(surrealResult?.map((r: any) => r.author).filter(Boolean) || [])] as string[];

      // console.log('*** ConversationSubgroup.stats() totalItems:', totalItems);
      // console.log('*** ConversationSubgroup.stats() participants:', participants);

      return { totalItems, participants };
    } catch (error) {
      console.error('Error getting subgroup stats:', error);
      return { totalItems: 0, participants: [] };
    }
  }

  async topics(): Promise<SynergyTopic[]> {
    // find the subgroups topics
    try {
      // const prologQuery = `
      //   % Collect and deduplicate topic data for this specific subgroup
      //   findall(TopicList, (
      //     findall([TopicBase, TopicName], (
      //       % 1. Find semantic relationships where 'flux://has_expression' = this subgroup's baseExpression
      //       subject_class("SemanticRelationship", SR),
      //       instance(SR, Relationship),
      //       triple(Relationship, "flux://has_expression", "${this.baseExpression}"),
      //
      //       % 2. Retrieve the Topic base
      //       triple(Relationship, "flux://has_tag", TopicBase),
      //
      //       % 3. Get the topic class & name
      //       subject_class("Topic", T),
      //       instance(T, TopicBase),
      //       property_getter(T, TopicBase, "topic", TopicName)
      //     ), UnsortedTopics),
      //
      //     % 4. Deduplicate via sort
      //     sort(UnsortedTopics, TopicList)
      //   ), [Topics]).
      // `;

      const surrealQuery = `
        SELECT
          out.uri AS topicBase,
          fn::parse_literal(out->link[WHERE predicate = 'flux://topic'][0].out.uri) AS topicName
        FROM link
        WHERE predicate = 'flux://has_tag'
          AND in->link[WHERE predicate = 'flux://has_expression'][0].out.uri = '${this.baseExpression}'
          AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_semantic_relationship'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_topic'
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
        }),
      );
    } catch (error) {
      console.error('Error getting subgroup topics:', error);
      return [];
    }
  }

  async itemsData(): Promise<SynergyItem[]> {
    // find the necissary data to render the subgroups items in timeline components
    try {
      // const prologQuery = `
      //   findall([Item, Timestamp, Author, Type, Text], (
      //     % 1. Get item linked to subgroup
      //     triple("${this.baseExpression}", "ad4m://has_child", Item),
      //
      //     % 2. Get timestamp and author from earliest link
      //     findall([T, A], link(_, "ad4m://has_child", Item, T, A), AllData),
      //     sort(AllData, SortedData),
      //     SortedData = [[Timestamp, Author]|_],
      //
      //     % 3. Check item type and get text content
      //     (
      //       Type = "Message",
      //       subject_class("Message", MC),
      //       instance(MC, Item),
      //       property_getter(MC, Item, "body", Text)
      //       ;
      //       Type = "Post",
      //       subject_class("Post", PC),
      //       instance(PC, Item),
      //       property_getter(PC, Item, "title", Text)
      //       ;
      //       Type = "Task",
      //       subject_class("Task", TC),
      //       instance(TC, Item),
      //       property_getter(TC, Item, "name", Text)
      //     )
      //   ), Items).
      // `;

      const surrealQuery = `
        SELECT
          out.uri AS baseExpression,
          timestamp,
          out->link[WHERE predicate = 'flux://entry_type'][0].author AS author,
          out->link[WHERE predicate = 'flux://entry_type'][0].out.uri AS type,
          fn::parse_literal(out->link[WHERE predicate = 'flux://body'][0].out.uri) AS messageBody,
          fn::parse_literal(out->link[WHERE predicate = 'flux://title'][0].out.uri) AS postTitle,
          fn::parse_literal(out->link[WHERE predicate = 'flux://name'][0].out.uri) AS taskName
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
        ORDER BY timestamp ASC
      `;

      // console.log('*** ConversationSubgroup.itemsData() surrealQuery:', surrealQuery);

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // console.log('*** ConversationSubgroup.itemsData() surrealResult:', JSON.stringify(surrealResult, null, 2));
      // console.log('*** ConversationSubgroup.itemsData() count:', surrealResult?.length);

      return (surrealResult || []).map((item: any) => {
        let text = '';
        let type = '';

        if (item.type === 'flux://has_message') {
          text = item.messageBody || '';
          type = 'Message';
        } else if (item.type === 'flux://has_post') {
          text = item.postTitle || '';
          type = 'Post';
        } else if (item.type === 'flux://has_task') {
          text = item.taskName || '';
          type = 'Task';
        }

        return {
          baseExpression: item.baseExpression,
          type,
          timestamp: new Date(item.timestamp).toISOString(),
          author: item.author,
          text,
          icon: icons[type] || 'question',
        };
      });
    } catch (error) {
      console.error('Error getting subgroup items:', error);
      return [];
    }
  }

  // todo: investigate why deduplication is necessary (just to handle errors?)
  async topicsWithRelevance(): Promise<TopicWithRelevance[]> {
    try {
      // const prologQuery = `
      //   findall(TopicList, (
      //     % First get all topic triples
      //     findall([TopicBase, TopicName, Relevance], (
      //       % 1. Find semantic relationships where expression = this subgroup
      //       subject_class("SemanticRelationship", SR),
      //       instance(SR, Relationship),
      //       triple(Relationship, "flux://has_expression", "${this.baseExpression}"),
      //
      //       % 2. Get topic and relevance
      //       triple(Relationship, "flux://has_tag", TopicBase),
      //       property_getter(SR, Relationship, "relevance", Relevance),
      //
      //       % 3. Get topic name
      //       subject_class("Topic", T),
      //       instance(T, TopicBase),
      //       property_getter(T, TopicBase, "topic", TopicName)
      //     ), UnsortedTopics),
      //
      //     % 4. Remove duplicates via sort
      //     sort(UnsortedTopics, TopicList)
      //   ), [Topics]).
      // `;

      const surrealQuery = `
        SELECT
          out.uri AS topicBase,
          fn::parse_literal(out->link[WHERE predicate = 'flux://topic'][0].out.uri) AS topicName,
          fn::parse_literal(in->link[WHERE predicate = 'flux://has_relevance'][0].out.uri) AS relevance
        FROM link
        WHERE predicate = 'flux://has_tag'
          AND in->link[WHERE predicate = 'flux://has_expression'][0].out.uri = '${this.baseExpression}'
          AND in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_semantic_relationship'
          AND out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_topic'
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      // Deduplicate by topicBase
      const uniqueTopics = new Map<string, any>();
      for (const topic of surrealResult || []) {
        if (!uniqueTopics.has(topic.topicBase)) {
          uniqueTopics.set(topic.topicBase, topic);
        }
      }

      return Array.from(uniqueTopics.values()).map(({ topicBase, topicName, relevance }) => ({
        baseExpression: topicBase,
        name: topicName,
        relevance: parseInt(relevance, 10) || 0,
      }));
    } catch (error) {
      console.error('Error getting subgroup topics with relevance:', error);
      return [];
    }
  }

  async updateTopicWithRelevance(
    topicName: string,
    relevance: number,
    isNewGroup: boolean,
    existingTopic: Topic | null,
    batchId: string,
  ) {
    let topic = existingTopic;
    if (!topic) {
      // console.log('create new topic for:', topicName);
      const newTopic = new Topic(this.perspective);
      newTopic.topic = Literal.from(topicName).toUrl();
      await newTopic.save(batchId);
      topic = await newTopic.get();
    }
    const existingTopicRelationship = isNewGroup
      ? null
      : ((
          await SemanticRelationship.findAll(this.perspective, {
            where: { expression: this.baseExpression, tag: topic.baseExpression },
          })
        )[0] as SemanticRelationship);
    if (existingTopicRelationship) {
      existingTopicRelationship.relevance = relevance;
      await existingTopicRelationship.update(batchId);
    } else {
      const relationship = new SemanticRelationship(this.perspective);
      relationship.expression = this.baseExpression;
      relationship.tag = topic.baseExpression;
      relationship.relevance = relevance;
      await relationship.save(batchId);
    }
  }
}
