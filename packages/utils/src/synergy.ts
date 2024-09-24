import { Ad4mClient, Ad4mSignalCB, AITask, LinkQuery, PerspectiveProxy } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import {
  Conversation,
  ConversationSubgroup,
  Message,
  Post,
  Relationship,
  SubjectRepository,
  Topic,
} from "@coasys/flux-api";
import { languages } from "@coasys/flux-constants";
import OpenAI from "openai";

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
        new LinkQuery({ source: itemId, target: r.id })
      );
      const relationshipTagLink = await perspective.get(
        new LinkQuery({ source: r.id, predicate: "flux://has_tag" })
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

  const embedding = await client.ai.embed("berd", text);

  return embedding;
}

async function saveEmbedding(perspective, itemId, embedding) {
  const { EMBEDDING_VECTOR_LANGUAGE } = languages;
  const embeddingExpression = await perspective.createExpression(
    { model: "berd", data: embedding },
    EMBEDDING_VECTOR_LANGUAGE
  );
  return await perspective.add({
    source: itemId,
    predicate: "ad4m://embedding",
    target: embeddingExpression,
  });
}

async function getConversationData(perspective, conversationRepo) {
  // check for previous conversations in the channel
  const conversations = (await conversationRepo.getAllData()) as any;
  let conversation;
  let latestSubgroups = [];
  let latestSubgroupItems = [] as any[];
  if (conversations.length) {
    // gather up lastest conversation data
    const latestConversation = conversations[conversations.length - 1];
    const subgroupRepo = await new SubjectRepository(ConversationSubgroup, {
      perspective,
      source: latestConversation.id,
    });
    latestSubgroups = (await subgroupRepo.getAllData()) as any;
    if (latestSubgroups.length) {
      const latestSubgroup = latestSubgroups[latestSubgroups.length - 1] as any;
      const subgroupItems = await getSubgroupItems(perspective, latestSubgroup.id);
      // calculate time since last item was created
      const lastItemTimestamp = subgroupItems[subgroupItems.length - 1].timestamp;
      const minsSinceLastItemCreated =
        (new Date().getTime() - new Date(lastItemTimestamp).getTime()) / (1000 * 60);
      if (minsSinceLastItemCreated < 30) {
        // if less than 30 mins, consider the new item part of the latest conversation
        conversation = latestConversation;
        latestSubgroupItems = subgroupItems;
      }
    }
  }
  if (!conversation) {
    // initialise a new conversation
    // @ts-ignore
    conversation = await conversationRepo.create({
      conversationName: `Conversation ${conversations.length + 1}`,
    });
    conversations.push(conversation);
  }

  return { conversations, latestSubgroups, latestSubgroupItems };
}

async function findOrCreateTopic(perspective, allTopics, newTopic) {
  let topicId;
  // check if topic already exists
  const match = allTopics.find((t) => t.name === newTopic);
  if (match) topicId = match.id;
  else {
    // create topic
    const topicRepo = await new SubjectRepository(Topic, { perspective });
    //@ts-ignore
    const topicExpression = (await topicRepo.create({
      topic: newTopic,
    })) as any;
    topicId = topicExpression.id;
  }
  return topicId;
}

async function linkTopic(perspective, itemId, topicId, relevance) {
  const relationshipRepo = (await new SubjectRepository(Relationship, {
    perspective,
    source: itemId,
  })) as any;
  return await relationshipRepo.create({
    expression: itemId,
    tag: topicId,
    relevance,
  });
}

async function LLMProcessing(newItem, latestSubgroups, latestSubgroupItems, allTopics) {
  const prompt = `
    I'm passing you a JSON object with the following properties: 'lastGroupings' (string block broken up into sections by line breaks <br/>), 'lastMessages' (string array), 'newMessage' (string), and 'existingTopics' (string array).

    { lastGroupings: [], lastMessages: [], newMessage: 'Some text', existingTopics: [] }

    Firstly, analyze the 'newMessage' string and identify between 1 and 5 topics (each a single word string in lowercase) that are relevant to the content of the 'newMessage' string. If any of the topics you choose are similar to topics listed in the 'existingTopics' array, use the existing topic instead of creating a new one (e.g., if one of the new topics you picked was 'foods' and you find an existing topic 'food', use 'food' instead of creating a new topic that is just a plural version of the existing topic). For each topic, provide a relevance score between 0 and 100 (0 being irrelevant and 100 being highly relevant) that indicates how relevant the topic is to the content of the 'newMessage' string.

    Secondly, compare the 'newMessage' with the content of 'lastMessages'. Consider the conversation as **related** if:
    - The 'newMessage' discusses, contrasts, or expands upon topics present in 'lastMessages'.
    - The 'newMessage' introduces new angles, comparisons, or opinions on the same topics discussed in 'lastMessages' (even if specific terms or phrases differ).

    Only consider the conversation as having **shifted to a new subject** if:
    - The 'newMessage' introduces entirely new topics, concepts, or themes that are not directly related to any topics discussed or implied in 'lastMessages'.
    - The 'newMessage' does not logically connect or refer back to the themes in the 'lastMessages'.

    If there are no items in the 'lastMessages' array, the conversation has by default shifted.

    After this analysis, return a new object with the following properties and nothing else:

    1. **'topics'**: an array of objects for each of the topics you have identified for the 'newMessage'. Each object should contain a 'name' property (string) for the name of the topic and a 'relevance' property (number) for its relevance score.

    2. **'changedSubject'**: a boolean value that indicates whether the conversation has shifted to a new subject or not. The conversation should be considered as shifted only if there is no significant overlap between the topics in the 'newMessage' and the topics in the 'lastMessages'.

    3. **'newSubgroupName'**: a 1 to 3 word title (string) for the conversation describing its contents. If changedSubject is true, base the title solely on the new message, otherwise base it on both the new message and the last messages. Don't reference previous conversations.

    4. **'newSubgroupSummary'**: a 1 to 3 sentence paragraph (string) summary of the conents of the conversation. If changedSubject is true, base the summary solely on the new message, otherwise base it on both the new message and the last messages. Don't reference previous conversations.

    5. **'newConversationName'**: a 1 to 3 word title (string) describing the contents of the lastGroupings plus the newSubgroupSummary. Don't reference previous conversations.

    6. **'newConversationSummary'**: a 1 to 3 sentence paragraph (string) summary of the the lastGroupings plus the newSubgroupSummary. Don't reference previous conversations.

    Make sure the response is in a format that can be parsed using JSON.parse(). Don't wrap it in code syntax.
  `;

  const examples = [{
    input: `{ lastGroupings: [], lastMessages: [], newMessage: 'hello world', existingTopics: [greeting] }`,
    output: `{"topics":[{"name":"greeting","relevance":100}],"changedSubject":true,"newSubgroupName":"Hello World","newSubgroupSummary":"The conversation starts with a simple greeting: 'hello world'.","newConversationName":"Hello World","newConversationSummary":"The conversation starts with a simple greeting: 'hello world'."}`,
  }, {
    input: `{ lastGroupings: [The conversation starts with a simple greeting: 'hello world'.], lastMessages: [<p>hello world</p><p></p>], newMessage: 'another hello 2', existingTopics: [greeting] }`,
    output: `{"topics":[{"name":"hello","relevance":80},{"name":"greeting","relevance":70}],"changedSubject":false,"newSubgroupName":"More Greetings","newSubgroupSummary":"The conversation continues with another greeting, showing the ongoing exchange of pleasantries.","newConversationName":"Simple Greetings","newConversationSummary":"The conversation starts with a simple greeting: 'hello world'. Following this, another greeting is exchanged, indicating the continuation of pleasantries."}`,
  }, {
    input: `{ lastGroupings: [The conversation continues with another greeting, showing the ongoing exchange of pleasantries.], lastMessages: [<p>hello world</p><p></p>, <p>another hello 2</p><p></p>], newMessage: 'game talk here', existingTopics: [greeting, hello] }`,
    output: `{"topics":[{"name":"game","relevance":100},{"name":"talk","relevance":80}],"changedSubject":true,"newSubgroupName":"Game Talk","newSubgroupSummary":"The conversation introduces a new topic with a focus on discussing games.","newConversationName":"Exchange of Pleasantries and Game Talk","newConversationSummary":"The conversation continues with another greeting, showing the ongoing exchange of pleasantries. The conversation then introduces a new topic with a focus on discussing games."}`
  }, {
    input: `{ lastGroupings: [The conversation continues with another greeting, showing the ongoing exchange of pleasantries. <br/> The conversation introduces a new topic with a focus on discussing games.], lastMessages: [<p>game talk here</p><p></p>], newMessage: 'dota 2 is the biggest esport game there is', existingTopics: [greeting, hello, game, talk] }`,
    output: `{"topics":[{"name":"game","relevance":90},{"name":"esport","relevance":85},{"name":"dota","relevance":100}],"changedSubject":false,"newSubgroupName":"Dota 2 Discussion","newSubgroupSummary":"The conversation continues with a focus on Dota 2, highlighting its prominence in the esports scene.","newConversationName":"Games and Esports","newConversationSummary":"The conversation continues with another greeting, showing the ongoing exchange of pleasantries. The conversation introduces a new topic with a focus on discussing games. The latest discussion centers on Dota 2, highlighting its significance in the world of esports."}`
  },]

  const client: Ad4mClient = await getAd4mClient();

  const tasks = await client.ai.tasks();

  let task = tasks.find((t) => t.name === "flux-synergy-task");

  console.log("Task: ", task);

  if (task) {
    // console.log("Task: updating existing task");
    // task.promptExamples = examples;
    // task.systemPrompt = prompt;
    // await client.ai.updateTask(task.taskId, task);
    // console.log("Task: ", task);
  } else {
    console.log("Task: creating new task");
    task = await client.ai.addTask("flux-synergy-task", "llama", prompt, examples)
    console.log("Task: ", task);
  }

  console.log("Task: calling prompt");

  const response = await client.ai.prompt(task.taskId, `{ lastGroupings: [${latestSubgroups.map((s) => s.summary).join(" <br/> ")}], lastMessages: [${latestSubgroupItems.map((si) => si.text).join(", ")}], newMessage: '${newItem.text}', existingTopics: [${allTopics.map((t) => t.name).join(", ")}] }`);

  console.log("AI Response: ", response);

  // const openai = new OpenAI({
  //   apiKey: localStorage?.getItem("openAIKey") || "",
  //   dangerouslyAllowBrowser: true,
  // });
  // const result = await openai.chat.completions.create({
  //   messages: [{ role: "user", content: prompt }],
  //   model: "gpt-4o",
  // });
  // console.log("Open AI request: ", `{ lastGroupings: [${latestSubgroups.map((s) => s.summary).join(" <br/> ")}], lastMessages: [${latestSubgroupItems.map((si) => si.text).join(", ")}], newMessage: '${newItem.text}', existingTopics: [${allTopics.map((t) => t.name).join(", ")}] }`);
  // console.log("Open AI response: ", JSON.parse(response), JSON.parse(result.choices[0].message.content));
  // const data = JSON.parse(result.choices[0].message.content || "");

  const data = JSON.parse(response);
  if (!data.newConversationName) data.newConversationName = ""
  if (!data.newConversationSummary) data.newConversationSummary = ""
  if (!data.newSubgroupName) data.newSubgroupName = ""
  if (!data.newSubgroupSummary) data.newSubgroupSummary = ""
  if (!data.topics) data.topics = []
  if (!data.changedSubject) data.changedSubject = false
  console.log("LLM Processing Data: ", data);
  return data;
}

export function transformItem(type, item) {
  // used to transform message, post, or task expressions into a common format
  const newItem = {
    type,
    id: item.id,
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
  return await new SubjectRepository(Relationship, {
    perspective,
    source: itemId,
  }).getAllData();
}

export async function findTopics(perspective, relationships) {
  return await Promise.all(
    relationships.map(
      (r) =>
        new Promise(async (resolve) => {
          const topicProxy = await perspective.getSubjectProxy(r.tag, "Topic");
          resolve({ id: r.tag, name: await topicProxy.topic, relevance: r.relevance });
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
              return { id: t.baseExpression, name: await t.topic };
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
  return new Promise(async (resolve: any) => {
    // check for existing relationships & removed processed data if present (used for edits)
    const relationships = await findRelationships(perspective, item.id);
    if (relationships.length) await removeProcessedData(perspective, item.id);
    // grab all the necissary conversation data
    const conversationRepo = await new SubjectRepository(Conversation, {
      perspective,
      source: channelId,
    });
    const { conversations, latestSubgroups, latestSubgroupItems } = await getConversationData(
      perspective,
      conversationRepo
    );
    const conversation = conversations[conversations.length - 1];
    const allTopics = await getAllTopics(perspective);
    // generate new processed data with OpenAI
    const {
      topics,
      changedSubject,
      newSubgroupName,
      newSubgroupSummary,
      newConversationName,
      newConversationSummary,
    } = await LLMProcessing(item, latestSubgroups, latestSubgroupItems, allTopics);
    // update conversation summary and title
    await conversationRepo.update(conversation.id, {
      conversationName: newConversationName,
      summary: newConversationSummary,
    });
    // update subgroup summary and title
    const subgroupRepo = await new SubjectRepository(ConversationSubgroup, {
      perspective,
      source: conversation.id,
    });
    let subgroup;
    if (!changedSubject) {
      // if the subject of the conversation has stayed the same, stick with the exising subgroup
      const lastSubgroup = latestSubgroups[latestSubgroups.length - 1];
      subgroup = lastSubgroup;
      await subgroupRepo.update(lastSubgroup.id, {
        subgroupName: newSubgroupName,
        summary: newSubgroupSummary,
      });
    } else {
      // otherwise create a new subgroup
      // @ts-ignore
      subgroup = (await subgroupRepo.create({
        subgroupName: newSubgroupName,
        summary: newSubgroupSummary,
      })) as any;
      // link subgroup to channel for use in search
      await perspective.add({
        source: channelId,
        predicate: "ad4m://has_child",
        target: subgroup.id,
      });
    }
    // link new item to subgroup
    await perspective.add({
      source: subgroup.id,
      predicate: "ad4m://has_child",
      target: item.id,
    });
    // attach topics to new item, conversation, & subgroup (avoid duplicates on conversation & subgroup)
    await Promise.all(
      topics.map(
        (topic) =>
          new Promise(async (resolve: any) => {
            // find existing topic or create new one
            const topicId = await findOrCreateTopic(perspective, allTopics, topic.name);
            // link topic to new item
            await linkTopic(perspective, item.id, topicId, topic.relevance);
            // find conversation topics
            const conversationRelationships = await findRelationships(perspective, conversation.id);
            const conversationTopics = await findTopics(perspective, conversationRelationships);
            if (!conversationTopics.find((t) => t.name === topic.name)) {
              // link topic to conversation if not already linked
              await linkTopic(perspective, conversation.id, topicId, topic.relevance);
            }
            // find subgroup topics
            const subgroupRelationships = await findRelationships(perspective, subgroup.id);
            const subgroupTopics = await findTopics(perspective, subgroupRelationships);
            if (!subgroupTopics.find((t) => t.name === topic.name)) {
              // link topic to subgroup if not already linked
              await linkTopic(perspective, subgroup.id, topicId, topic.relevance);
            }
            resolve();
          })
      )
    );
    // generate & save new embedding for item
    const itemEmbedding = await generateEmbedding(item.text);
    await saveEmbedding(perspective, item.id, itemEmbedding);
    // generate & save updated embedding for subgroup
    await removeEmbedding(perspective, subgroup.id);
    const subgroupEmbedding = await generateEmbedding(newSubgroupSummary);
    await saveEmbedding(perspective, subgroup.id, subgroupEmbedding);
    // generate & save updated embedding for conversation
    await removeEmbedding(perspective, conversation.id);
    const conversationEmbedding = await generateEmbedding(newConversationSummary);
    await saveEmbedding(perspective, conversation.id, conversationEmbedding);
    resolve();
  });
}
