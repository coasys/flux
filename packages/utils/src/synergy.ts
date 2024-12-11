import { Ad4mClient, LinkQuery } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import {
  Conversation,
  ConversationSubgroup,
  Message,
  Post,
  SemanticRelationship,
  SubjectRepository,
  Topic,
} from "@coasys/flux-api";
import { languages } from "@coasys/flux-constants";
//@ts-ignore
import JSON5 from "json5";

async function removeEmbedding(perspective, itemId) {
  const embeddingLink = await perspective.get(
    new LinkQuery({ source: itemId, predicate: "ad4m://embedding" })
  );
  if (embeddingLink[0]) return perspective.remove(embeddingLink[0]);
}

async function removeTopics(perspective, itemId) {
  const relationships = (await findRelationships(perspective, itemId)) as any;
  return Promise.all(
    relationships.map(async (r) => {
      const itemRelationshipLink = await perspective.get(
        new LinkQuery({ source: itemId, target: r.baseExpression })
      );
      const relationshipTagLink = await perspective.get(
        new LinkQuery({ source: r.baseExpression, predicate: "flux://has_tag" })
      );
      const linksToRemove = [] as any[];
      if (itemRelationshipLink[0]) linksToRemove.push(itemRelationshipLink[0]);
      if (relationshipTagLink[0]) linksToRemove.push(relationshipTagLink[0]);
      return await perspective.removeLinks(linksToRemove);
    })
  );
}

async function removeProcessedData(perspective, itemId) {
  return await Promise.all([
    removeEmbedding(perspective, itemId),
    removeTopics(perspective, itemId),
  ]);
}

export async function generateEmbedding(text: string) {
  const client = await getAd4mClient();
  const embedding = await client.ai.embed("bert", text);
  return embedding;
}

async function saveEmbedding(perspective, itemId, embedding) {
  const { EMBEDDING_VECTOR_LANGUAGE } = languages;
  const embeddingExpression = await perspective.createExpression(
    { model: "bert", data: embedding },
    EMBEDDING_VECTOR_LANGUAGE
  );
  return await perspective.add({
    source: itemId,
    predicate: "ad4m://embedding",
    target: embeddingExpression,
  });
}

async function getConversationData(perspective, channelId) {
  // check for previous conversations in the channel
  const conversations = await Conversation.query(perspective, { source: channelId });
  let conversation;
  let subgroups = [] as any;
  let subgroupItems = [] as any[];
  if (conversations.length) {
    // gather up lastest conversation data
    const latestConversation = conversations[conversations.length - 1];
    subgroups = await ConversationSubgroup.query(perspective, {
      source: latestConversation.baseExpression,
    });
    if (subgroups.length) {
      const latestSubgroup = subgroups[subgroups.length - 1] as any;
      const latestSubgroupItems = await getSubgroupItems(
        perspective,
        latestSubgroup.baseExpression
      );
      // calculate time since last item was created
      const lastItemTimestamp = latestSubgroupItems[latestSubgroupItems.length - 1].timestamp;
      const minsSinceLastItemCreated =
        (new Date().getTime() - new Date(lastItemTimestamp).getTime()) / (1000 * 60);
      if (minsSinceLastItemCreated < 30) {
        // if less than 30 mins, consider the new item part of the latest conversation
        conversation = latestConversation;
        subgroupItems = latestSubgroupItems;
      }
    }
  }
  if (!conversation) {
    // initialise a new conversation
    conversation = new Conversation(perspective, undefined, channelId);
    conversation.conversationName = `Conversation ${conversations.length + 1}`;
    await conversation.save();
  }

  return { conversation, subgroups, subgroupItems };
}

async function findOrCreateTopic(perspective, allTopics, topicName) {
  let topicId;
  // check if topic already exists
  const match = allTopics.find((t) => t.name === topicName);
  if (match) topicId = match.baseExpression;
  else {
    // create topic
    const newTopic = new Topic(perspective);
    newTopic.topic = topicName;
    await newTopic.save();
    topicId = newTopic.baseExpression;
  }
  return topicId;
}

// todo: refactor so source doesn't need to be passed to new SemanticRelationship as stored in expression property
async function linkTopic(perspective, itemId, topicId, relevance) {
  const relationship = new SemanticRelationship(perspective, undefined, itemId);
  // const relationship = new SemanticRelationship(perspective);
  relationship.expression = itemId;
  relationship.tag = topicId;
  relationship.relevance = relevance;
  await relationship.save();
  return relationship;
}

async function LLMProcessing(
  newItem,
  latestSubgroups,
  latestSubgroupItems,
  allTopics,
  attemptKey?: number
) {
  console.log(
    "LLMProcessing: ",
    newItem,
    latestSubgroups,
    latestSubgroupItems,
    allTopics,
    attemptKey
  );

  const prompt = `
    I'm passing you a JSON object with the following properties: 'previousSubgroups' (string block broken up into sections by line breaks <br/>), 'previousMessages' (string array), 'newMessage' (string), and 'existingTopics' (string array).
    { previousSubgroups: [], previousMessages: [], newMessage: 'Some text', existingTopics: [] }
    Firstly, analyze the 'newMessage' string and identify between 1 and 5 topics (each a single word string in lowercase) that are relevant to the content of the 'newMessage' string. If any of the topics you choose are similar to topics listed in the 'existingTopics' array, use the existing topic instead of creating a new one (e.g., if one of the new topics you picked was 'foods' and you find an existing topic 'food', use 'food' instead of creating a new topic that is just a plural version of the existing topic). For each topic, provide a relevance score between 0 and 100 (0 being irrelevant and 100 being highly relevant) that indicates how relevant the topic is to the content of the 'newMessage' string.
    Secondly, compare the 'newMessage' with the content of 'previousMessages'. Consider the conversation as **related** if:
    - The 'newMessage' discusses, contrasts, or expands upon topics present in 'previousMessages'.
    - The 'newMessage' introduces new angles, comparisons, or opinions on the same topics discussed in 'previousMessages' (even if specific terms or phrases differ).
    Only consider the conversation as having **shifted to a new subject** if:
    - The 'newMessage' introduces entirely new topics, concepts, or themes that are not directly related to any topics discussed or implied in 'previousMessages'.
    - The 'newMessage' does not logically connect or refer back to the themes in the 'previousMessages'.
    If there are no items in the 'previousMessages' array, the conversation has by default shifted.
    After this analysis, return a new object with the following properties and nothing else:
    1. **'topics'**: an array of objects for each of the topics you have identified for the 'newMessage'. Each object should contain a 'name' property (string) for the name of the topic and a 'relevance' property (number) for its relevance score.
    2. **'changedSubject'**: a boolean value that indicates whether the conversation has shifted to a new subject or not. The conversation should be considered as shifted only if there is no significant overlap between the topics in the 'newMessage' and the topics in the 'previousMessages'.
    3. **'newSubgroupName'**: a 1 to 3 word title (string) for the conversation describing its contents. If changedSubject is true, base the title solely on the new message, otherwise base it on both the new message and the last messages. Don't reference previous conversations.
    4. **'newSubgroupSummary'**: a 1 to 3 sentence paragraph (string) summary of the conents of the conversation. If changedSubject is true, base the summary solely on the new message, otherwise base it on both the new message and the last messages. Don't reference previous conversations.
    5. **'newConversationName'**: a 1 to 3 word title (string) describing the contents of the previousSubgroups plus the newSubgroupSummary. Don't reference previous conversations.
    6. **'newConversationSummary'**: a 1 to 3 sentence paragraph (string) summary of the the previousSubgroups plus the newSubgroupSummary. Don't reference previous conversations.
    Make sure the response is in a format that can be parsed using JSON.parse(). Don't wrap it in code syntax.
  `;

  const examples = [
    {
      input: `{ previousSubgroups: [], previousMessages: [], newMessage: 'hello world', existingTopics: [greeting] }`,
      output: `{"topics":[{"name":"greeting","relevance":100}],"changedSubject":true,"newSubgroupName":"Hello World","newSubgroupSummary":"The conversation starts with a simple greeting: 'hello world'.","newConversationName":"Hello World","newConversationSummary":"The conversation starts with a simple greeting: 'hello world'."}`,
    },
    {
      input: `{ previousSubgroups: [The conversation starts with a simple greeting: 'hello world'.], previousMessages: [<p>hello world</p><p></p>], newMessage: 'another hello 2', existingTopics: [greeting] }`,
      output: `{"topics":[{"name":"hello","relevance":80},{"name":"greeting","relevance":70}],"changedSubject":false,"newSubgroupName":"More Greetings","newSubgroupSummary":"The conversation continues with another greeting, showing the ongoing exchange of pleasantries.","newConversationName":"Simple Greetings","newConversationSummary":"The conversation starts with a simple greeting: 'hello world'. Following this, another greeting is exchanged, indicating the continuation of pleasantries."}`,
    },
    {
      input: `{ previousSubgroups: [The conversation continues with another greeting, showing the ongoing exchange of pleasantries.], previousMessages: [<p>hello world</p><p></p>, <p>another hello 2</p><p></p>], newMessage: 'game talk here', existingTopics: [greeting, hello] }`,
      output: `{"topics":[{"name":"game","relevance":100},{"name":"talk","relevance":80}],"changedSubject":true,"newSubgroupName":"Game Talk","newSubgroupSummary":"The conversation introduces a new topic with a focus on discussing games.","newConversationName":"Exchange of Pleasantries and Game Talk","newConversationSummary":"The conversation continues with another greeting, showing the ongoing exchange of pleasantries. The conversation then introduces a new topic with a focus on discussing games."}`,
    },
    {
      input: `{ previousSubgroups: [The conversation continues with another greeting, showing the ongoing exchange of pleasantries. <br/> The conversation introduces a new topic with a focus on discussing games.], previousMessages: [<p>game talk here</p><p></p>], newMessage: 'dota 2 is the biggest esport game there is', existingTopics: [greeting, hello, game, talk] }`,
      output: `{"topics":[{"name":"game","relevance":90},{"name":"esport","relevance":85},{"name":"dota","relevance":100}],"changedSubject":false,"newSubgroupName":"Dota 2 Discussion","newSubgroupSummary":"The conversation continues with a focus on Dota 2, highlighting its prominence in the esports scene.","newConversationName":"Games and Esports","newConversationSummary":"The conversation continues with another greeting, showing the ongoing exchange of pleasantries. The conversation introduces a new topic with a focus on discussing games. The latest discussion centers on Dota 2, highlighting its significance in the world of esports."}`,
    },
  ];

  const client: Ad4mClient = await getAd4mClient();
  const tasks = await client.ai.tasks();
  let task = tasks.find((t) => t.name === "flux-synergy-task");
  if (!task) {
    task = await client.ai.addTask("flux-synergy-task", "default", prompt, examples);
  }

  const response = await client.ai.prompt(
    task.taskId,
    `{
      previousSubgroups: [${latestSubgroups.map((s: any) => s.summary).join(" <br/> ")}],
      previousMessages: [${latestSubgroupItems.map((si: any) => si.text).join(", ")}],
      newMessage: '${newItem.text}',
      existingTopics: [${allTopics.map((t: any) => t.name).join(", ")}]
    }`
  );
  console.log("LLM Response: ", response);

  let parsedData;
  try {
    parsedData = JSON5.parse(response);
  } catch (error) {
    console.error("Failed to parse LLM response:", error);
    if (!attemptKey || attemptKey < 5) {
      // retry up to 5 times if LLM fails to produce valid JSON
      return await LLMProcessing(
        newItem,
        latestSubgroups,
        latestSubgroupItems,
        allTopics,
        attemptKey ? attemptKey + 1 : 1
      );
    } else {
      // give up and return empty data
      console.error("Failed to parse LLM response after 5 attempts. Returning empty data.");
      return {
        topics: [],
        changedSubject: false,
        newSubgroupName: "",
        newSubgroupSummary: "",
        newConversationName: "",
        newConversationSummary: "",
      };
    }
  }

  return {
    topics: parsedData.topics || [],
    changedSubject: parsedData.changedSubject || false,
    newSubgroupName: parsedData.newSubgroupName || "",
    newSubgroupSummary: parsedData.newSubgroupSummary || "",
    newConversationName: parsedData.newConversationName || "",
    newConversationSummary: parsedData.newConversationSummary || "",
  };
}

export function transformItem(type, item) {
  // used to transform message, post, or task expressions into a common format
  const newItem = {
    type,
    baseExpression: item.id,
    author: item.author,
    timestamp: item.timestamp,
    text: "",
    icon: "question",
  };
  if (type === "Message") {
    newItem.text = item.body;
    newItem.icon = "chat";
  } else if (type === "Post") {
    newItem.text = item.title || item.body;
    newItem.icon = "postcard";
  } else if (type === "Task") {
    newItem.text = item.name;
    newItem.icon = "kanban";
  }
  return newItem;
}

export async function findRelationships(perspective, itemId) {
  return await SemanticRelationship.query(perspective, { source: itemId });
}

export async function findTopics(perspective, relationships) {
  return await Promise.all(
    relationships.map(
      (r) =>
        new Promise(async (resolve) => {
          const topicProxy = await perspective.getSubjectProxy(r.tag, "Topic");
          resolve({
            baseExpression: r.tag,
            name: await topicProxy.topic,
            relevance: r.relevance,
          });
        })
    )
  );
}

export async function getAllTopics(perspective) {
  // gather up all existing topics in the neighbourhood
  // const topics = await perspective.getAllSubjectInstances("Topic");
  // return await Promise.all(
  //   topics.map(async (t) => {
  //     return { id: t.baseExpression, name: await t.topic };
  //   })
  // );

  // temp workaround while getAllSubjectInstances broken if < 2 results
  return await new Promise((resolve) => {
    perspective
      .getAllSubjectInstances("Topic")
      .then(async (topics) => {
        resolve(
          await Promise.all(
            topics.map(async (t) => {
              return { baseExpression: t.baseExpression, name: await t.topic };
            })
          )
        );
      })
      .catch(() => resolve([]));
  });
}

export async function getSubgroupItems(perspective, subgroupId) {
  const messages = await new SubjectRepository(Message, {
    perspective,
    source: subgroupId,
  }).getAllData();
  const posts = await new SubjectRepository(Post, {
    perspective,
    source: subgroupId,
  }).getAllData();
  const tasks = await new SubjectRepository("Task", {
    perspective,
    source: subgroupId,
  }).getAllData();
  return [
    ...messages.map((message) => transformItem("Message", message)),
    ...posts.map((post) => transformItem("Post", post)),
    ...tasks.map((task) => transformItem("Task", task)),
  ].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

export async function processItem(perspective, channelId, item) {
  console.log("processItem: ", item);
  return new Promise(async (resolve: any) => {
    // check for existing relationships & removed processed data if present (used for edits)
    const relationships = await findRelationships(perspective, item.baseExpression);
    if (relationships.length) await removeProcessedData(perspective, item.baseExpression);
    // grab all the necissary conversation data
    const { conversation, subgroups, subgroupItems } = await getConversationData(
      perspective,
      channelId
    );
    const allTopics = await getAllTopics(perspective);
    // generate new processed data with OpenAI
    const {
      topics,
      changedSubject,
      newSubgroupName,
      newSubgroupSummary,
      newConversationName,
      newConversationSummary,
    } = await LLMProcessing(item, subgroups, subgroupItems, allTopics);
    // update conversation summary and title
    if (newConversationName) conversation.conversationName = newConversationName;
    if (newConversationSummary) conversation.summary = newConversationSummary;
    if (newConversationName || newConversationSummary) await conversation.update();
    // update subgroup summary and title
    let subgroup;
    if (!changedSubject) {
      // if the subject of the conversation has stayed the same, stick with the exising subgroup
      subgroup = subgroups[subgroups.length - 1];
      if (newSubgroupName) subgroup.subgroupName = newSubgroupName;
      if (newSubgroupSummary) subgroup.summary = newSubgroupSummary;
      if (newSubgroupName || newSubgroupSummary) await subgroup.update();
    } else {
      // otherwise create a new subgroup
      subgroup = new ConversationSubgroup(perspective, undefined, conversation.baseExpression);
      subgroup.subgroupName = newSubgroupName;
      subgroup.summary = newSubgroupSummary;
      await subgroup.save();
      // link subgroup to channel for use in search
      await perspective.add({
        source: channelId,
        predicate: "ad4m://has_child",
        target: subgroup.baseExpression,
      });
    }
    // link new item to subgroup
    await perspective.add({
      source: subgroup.baseExpression,
      predicate: "ad4m://has_child",
      target: item.baseExpression,
    });
    // attach topics to new item, conversation, & subgroup (avoid duplicates on conversation & subgroup)
    await Promise.all(
      topics.map(
        (topic) =>
          new Promise(async (resolve: any) => {
            // find existing topic or create new one
            const topicId = await findOrCreateTopic(perspective, allTopics, topic.name);
            // link topic to new item
            await linkTopic(perspective, item.baseExpression, topicId, topic.relevance);
            // find conversation topics
            const conversationRelationships = await findRelationships(
              perspective,
              conversation.baseExpression
            );
            const conversationTopics = await findTopics(perspective, conversationRelationships);
            if (!conversationTopics.find((t) => t.name === topic.name)) {
              // link topic to conversation if not already linked
              await linkTopic(perspective, conversation.baseExpression, topicId, topic.relevance);
            }
            // find subgroup topics
            const subgroupRelationships = await findRelationships(
              perspective,
              subgroup.baseExpression
            );
            const subgroupTopics = await findTopics(perspective, subgroupRelationships);
            if (!subgroupTopics.find((t) => t.name === topic.name)) {
              // link topic to subgroup if not already linked
              await linkTopic(perspective, subgroup.baseExpression, topicId, topic.relevance);
            }
            resolve();
          })
      )
    );
    // todo: combine generate & save emebedding?
    // generate & save new embedding for item
    const itemEmbedding = await generateEmbedding(item.text);
    await saveEmbedding(perspective, item.baseExpression, itemEmbedding);
    // generate & save updated embedding for subgroup
    await removeEmbedding(perspective, subgroup.baseExpression);
    const subgroupEmbedding = await generateEmbedding(newSubgroupSummary);
    await saveEmbedding(perspective, subgroup.baseExpression, subgroupEmbedding);
    // generate & save updated embedding for conversation
    await removeEmbedding(perspective, conversation.baseExpression);
    const conversationEmbedding = await generateEmbedding(newConversationSummary);
    await saveEmbedding(perspective, conversation.baseExpression, conversationEmbedding);
    resolve();
  });
}

export async function startTranscription(callback: (text) => void) {
  const client = await getAd4mClient();
  return await client.ai.openTranscriptionStream("Whisper", callback);
}

export async function feedTranscription(id, chunks) {
  const client = await getAd4mClient();
  await client.ai.feedTranscriptionStream(id, Array.from(chunks));
}

export async function stopTranscription(id) {
  const client = await getAd4mClient();
  await client.ai.closeTranscriptionStream(id);
}
