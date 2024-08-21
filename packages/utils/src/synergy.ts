import { Relationship, SubjectRepository, Topic } from "@coasys/flux-api";
import { languages } from "@coasys/flux-constants";
import EmbeddingWorker from "@coasys/flux-utils/src/embeddingWorker?worker&inline";
import OpenAI from "openai";

export function transformItem(channelId, type, item) {
  // used to transform message, post, or task expressions into a common format
  const newItem = {
    channelId,
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
          resolve({ name: await topicProxy.topic, relevance: r.relevance });
        })
    )
  );
}

export function getAllTopics(perspective, setTopics) {
  // gather up all existing topics in the neighbourhood
  return perspective
    .getAllSubjectInstances("Topic")
    .then(async (topics) => {
      setTopics(
        await Promise.all(
          topics.map(async (t) => {
            return { id: t.baseExpression, name: await t.topic };
          })
        )
      );
    })
    .catch(console.log);
}

async function generateTopics(allTopics, text) {
  const prompt = `Analyse the following block of text and return only a JSON object containing three values: topics, meaning, and intent. Topics will be a array of between (min) 1 and (max) 5 objects which each contain a name property (one word string in lowercase) describing the topic of the content and a relevance property with a number between 0 and 100 indicating how relevant the topic is to the text. Meaning will be a max 3 sentence string summarising the meaning of the content. And Intent will be a single sentence string guessing the intent of the text. If any of the selected topics are close to the topics listed in this array ([${allTopics.map((t) => t.name)}]), use the existing topics instead of creating new ones: <br/> <br/>`;
  const openai = new OpenAI({
    apiKey: localStorage?.getItem("openAIKey") || "",
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    messages: [{ role: "user", content: `${prompt} ${text}` }],
    model: "gpt-3.5-turbo",
  });
  const data = JSON.parse(result.choices[0].message.content);
  console.log("Open AI response: ", data);
  return data.topics;
}

async function generateEmbedding(text: string) {
  const embeddingWorker = new EmbeddingWorker();
  return new Promise((resolve) => {
    embeddingWorker.postMessage({
      type: "embed",
      text,
      messageId: new Date().getTime().toString(),
    });
    embeddingWorker.onmessage = (e) => {
      if (e.data.type === "embed") resolve(e.data.embedding);
    };
  });
}

async function saveTopic(perspective, allTopics, itemId, topic) {
  const { name, relevance } = topic;
  let topicId;
  // check if topic already exists
  const match = allTopics.find((t) => t.name === name);
  if (match) topicId = match.id;
  else {
    // create topic
    const topicRepo = await new SubjectRepository(Topic, { perspective });
    //@ts-ignore
    const topicExpression = (await topicRepo.create({ topic: name })) as any;
    topicId = topicExpression.id;
  }
  // create relationship to link topic with expression
  const relationshipRepo = await new SubjectRepository(Relationship, {
    perspective,
    source: itemId,
  });
  //@ts-ignore
  return await relationshipRepo.create({
    expression: itemId,
    tag: topicId,
    relevance,
  });
}

async function saveEmbedding(perspective, itemId, embedding) {
  const { EMBEDDING_VECTOR_LANGUAGE } = languages;
  const embeddingExpression = await perspective.createExpression(
    { model: "TaylorAI/gte-tiny", data: embedding },
    EMBEDDING_VECTOR_LANGUAGE
  );
  return await perspective.add({
    source: itemId,
    predicate: "ad4m://embedding",
    target: embeddingExpression,
  });
}

export async function processItem(perspective, allTopics, item) {
  return new Promise(async (resolve: any) => {
    // check for existing relationships
    const relationships = await findRelationships(perspective, item.id);
    // skip if already processed
    if (relationships.length) resolve();
    else {
      // generate & save new topics
      const topics = await generateTopics(allTopics, item.text);
      const saveTopics = await Promise.all(
        topics.map((topic) => saveTopic(perspective, allTopics, item.id, topic))
      );
      // generate & save embedding
      const embedding = await generateEmbedding(item.text);
      const saveVectorEmbedding = await saveEmbedding(
        perspective,
        item.id,
        embedding
      );
      Promise.all([saveTopics, saveVectorEmbedding])
        .then(() => resolve())
        .catch(console.log);
    }
  });
}
