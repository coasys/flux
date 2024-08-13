import { Relationship, SubjectRepository, Topic } from "@coasys/flux-api";
import OpenAI from "openai";

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
          resolve(await topicProxy.topic);
        })
    )
  );
}

async function parseTopics(allTopics, item) {
  const prompt = `Analyse the following block of text and return only a JSON object containing three values: topics, meaning, and intent. Topics will be a array of between (min) 1 and (max) 5 objects which each contain a name property (one word string in lowercase) describing the topic of the content and a relevance property with a number between 0 and 100 indicating how relevant the topic is to the text. Meaning will be a max 3 sentence string summarising the meaning of the content. And Intent will be a single sentence string guessing the intent of the text. If any of the selected topics are close to the topics listed in this array ([${allTopics.map((t) => t.name)}]), use the existing topics instead of creating new ones: <br/> <br/>`;
  const openai = new OpenAI({
    apiKey: localStorage?.getItem("openAIKey"),
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    messages: [{ role: "user", content: `${prompt} ${item.text}` }],
    model: "gpt-3.5-turbo",
  });
  const data = JSON.parse(result.choices[0].message.content);
  console.log("Open AI response: ", data);
  return data;
}

async function createTopic(perspective, allTopics, itemId, topic) {
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

export async function processItem(perspective, allTopics, item) {
  return new Promise(async (resolve: any) => {
    // check for existing relationships
    const relationships = await findRelationships(perspective, item.id);
    // skip if already processed
    if (relationships.length) resolve();
    else {
      // parse & create new topics
      const data = await parseTopics(allTopics, item);
      Promise.all(
        data.topics.map((topic) =>
          createTopic(perspective, allTopics, item.id, topic)
        )
      )
        .then(() => resolve())
        .catch(console.log);
    }
  });
}
