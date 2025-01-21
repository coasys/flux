import {
  Ad4mClient,
  AITask,
  LinkQuery,
  PerspectiveExpression,
  NeighbourhoodProxy,
  PerspectiveProxy,
} from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import {
  Conversation,
  ConversationSubgroup,
  Embedding,
  Message,
  Post,
  SemanticRelationship,
  SubjectRepository,
  Topic,
} from "@coasys/flux-api";
//@ts-ignore
import JSON5 from "json5";
import { v4 as uuidv4 } from "uuid";
import { synergyGroupingPrompt, synergyGroupingExamples } from "./synergy-prompts";
import { sleep } from "./sleep";

async function removeEmbedding(perspective, itemId) {
  const allSemanticRelationships = (await SemanticRelationship.query(perspective, {
    source: itemId,
  })) as any;
  const embeddingSR = allSemanticRelationships.find((sr) => !sr.relevance);
  if (embeddingSR) {
    const embedding = new Embedding(perspective, embeddingSR.tag);
    await embedding.delete(); // delete the embedding
    await embeddingSR.delete(); // delete the semantic relationship
  }
}

// todo: use embedding language instead of stringifying
async function createEmbedding(perspective, text, itemId) {
  // generate embedding
  const client = await getAd4mClient();
  const rawEmbedding = await client.ai.embed("bert", text);
  // create embedding subject entity
  const embedding = new Embedding(perspective, undefined, itemId);
  embedding.model = "bert";
  embedding.embedding = JSON.stringify(rawEmbedding);
  await embedding.save();
  // create semantic relationship subject entity
  const relationship = new SemanticRelationship(perspective, undefined, itemId);
  relationship.expression = itemId;
  relationship.tag = embedding.baseExpression;
  await relationship.save();
}

async function linkTopic(perspective, itemId, topicId, relevance) {
  const relationship = new SemanticRelationship(perspective, undefined, itemId);
  relationship.expression = itemId;
  relationship.tag = topicId;
  relationship.relevance = relevance;
  await relationship.save();
}

export async function ensureLLMTask(): Promise<AITask> {
  const client: Ad4mClient = await getAd4mClient();
  const tasks = await client.ai.tasks();
  let task = tasks.find((t) => t.name === "flux-synergy-task");
  if (!task)
    task = await client.ai.addTask("flux-synergy-task", "default", synergyGroupingPrompt, synergyGroupingExamples);
  return task;
}

async function LLMProcessing(unprocessedItems, subgroups, currentSubgroup, existingTopics) {
  const task = await ensureLLMTask();
  const client: Ad4mClient = await getAd4mClient();
  let prompt = {
    existingTopics: existingTopics.map((t: any) => t.name),
    previousSubgroups: subgroups.map((s: any) => {
      return { name: s.subgroupName, summary: s.summary };
    }),
    currentSubgroup,
    unprocessedItems: unprocessedItems.map((item: any) => {
      return { id: item.baseExpression, text: item.text };
    }),
  };
  // attempt LLM task up to 5 times before giving up
  let parsedData;
  let attempts = 0;
  while (!parsedData && attempts < 5) {
    attempts += 1;
    console.log("LLM Prompt:", prompt);
    const response = await client.ai.prompt(task.taskId, JSON.stringify(prompt));
    console.log("LLM Response: ", response);
    try {
      // todo: include check here to ensure all expected properties are present in the response
      parsedData = JSON5.parse(response);
    } catch (error) {
      console.error("LLM response parse error:", error);
      //@ts-ignore
      prompt.jsonParseError = error;
    }
  }

  if (parsedData) {
    return {
      conversationData: parsedData.conversationData,
      currentSubgroup: parsedData.currentSubgroup,
      newSubgroup: parsedData.newSubgroup,
    };
  } else {
    // give up and return empty data
    console.error("Failed to parse LLM response after 5 attempts. Returning empty data.");
    return {
      conversationData: { name: "", summary: "" },
      currentSubgroup: { name: "", summary: "", topics: [] },
      newSubgroup: { name: "", summary: "", topics: [] },
    };
  }
}

export function transformItem(type, item) {
  // used to transform message, post, or task subject entities into a common format
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

export async function findTopics(perspective, itemId) {
  const allRelationships = (await SemanticRelationship.query(perspective, {
    source: itemId,
  })) as any;

  const topics = [];
  for (const rel of allRelationships) {
    if (!rel.relevance) continue;

    try {
      const topicEntity = new Topic(perspective, rel.tag);
      const topic = await topicEntity.get();
      topics.push({
        baseExpression: rel.tag,
        name: topic.topic,
        relevance: rel.relevance,
      });
    } catch (error) {
      continue;
    }
  }

  return topics;
}

export async function getAllTopics(perspective) {
  // gather up all existing topics in the neighbourhood
  return (await Topic.query(perspective)).map((topic: any) => {
    return { baseExpression: topic.baseExpression, name: topic.topic };
  });
}

// todo: use raw prolog query here so subject classes don't need to be hard coded
export async function getSynergyItems(perspective, parentId) {
  // parentId used so we can get items linked to a channel (unprocessed) or conversation
  const messages = await new SubjectRepository(Message, {
    perspective,
    source: parentId,
  }).getAllData();
  const posts = await new SubjectRepository(Post, {
    perspective,
    source: parentId,
  }).getAllData();
  const tasks = await new SubjectRepository("Task", {
    perspective,
    source: parentId,
  }).getAllData();
  // transform items into common format
  const transformedItems = [
    ...messages.map((message) => transformItem("Message", message)),
    ...posts.map((post) => transformItem("Post", post)),
    ...tasks.map((task) => transformItem("Task", task)),
  ];
  // order items by timestamp
  const orderedItems = transformedItems.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  return orderedItems;
}

export async function getDefaultLLM() {
  const client = await getAd4mClient();
  return await client.ai.getDefaultModel("LLM");
}

export async function findUnprocessedItems(perspective: any, items: any[]) {
  const results = await Promise.all(
    items.map(async (item) => {
      const links = await perspective.get(
        new LinkQuery({ predicate: "ad4m://has_child", target: item.baseExpression })
      );
      return links.length === 1 ? item : null;
    })
  );
  return results.filter(Boolean);
}

async function findItemsAuthor(perspective: any, channelId: string, itemId: string) {
  // find the link connecting the item to the channel
  const itemChannelLinks = await perspective.get(
    new LinkQuery({ source: channelId, predicate: "ad4m://has_child", target: itemId })
  );
  // return the author of the links did
  return itemChannelLinks[0].author;
}

async function isMe(did: string) {
  // checks if the did is mine
  const client = await getAd4mClient();
  const me = await client.agent.me();
  return did === me.did;
}

let receivedSignals: any[] = [];
let signalHandler: ((expression: PerspectiveExpression) => void) | null = null;

async function onSignalReceived(expression: PerspectiveExpression, neighbourhood: NeighbourhoodProxy) {
  const link = expression.data.links[0];
  const { author, data } = link;
  const { predicate, target } = data;

  if (predicate === "can-you-process-items") {
    const defaultLLM = await getDefaultLLM();
    if (defaultLLM) {
      await neighbourhood.sendSignalU(author, { links: [{ source: "", predicate: "i-can-process-items", target }] });
    }
    // todo: respond if can't process items too?
    // await neighbourhood.sendSignalU(author, {
    //   links: [
    //     {
    //       source: "", // channelId (not necissary?)
    //       predicate: `i-${defaultLLM ? "can" : "cant"}-process-items`,
    //       target,
    //     },
    //   ],
    // });
  }

  if (predicate === "i-can-process-items") {
    console.log("Signal recieved: remote agent can process items!");
    receivedSignals.push(link);
  }

  // // is this necissary (might be slightly quicker than waiting for timeout...)
  // if (predicate === "i-cant-process-items") {
  // }
}

export async function addSynergySignalHandler(perspective: PerspectiveProxy) {
  const neighbourhood = await perspective.getNeighbourhoodProxy();
  signalHandler = (expression: PerspectiveExpression) => onSignalReceived(expression, neighbourhood);
  neighbourhood.addSignalHandler(signalHandler);
}

export async function removeSynergySignalHandler(perspective: PerspectiveProxy) {
  if (signalHandler) {
    const neighbourhood = await perspective.getNeighbourhoodProxy();
    neighbourhood.removeSignalHandler(signalHandler);
    signalHandler = null;
  }
}

async function agentCanProcessItems(neighbourhood: NeighbourhoodProxy, agentsDid: string): Promise<boolean> {
  const signalUuid = uuidv4();
  await neighbourhood.sendSignalU(agentsDid, {
    links: [{ source: "", predicate: "can-you-process-items", target: signalUuid }],
  });

  await sleep(3000);
  return receivedSignals.some((s) => s.data.target === signalUuid);
}
// todo: store these consts in channel settings
const minNumberOfItemsToProcess = 5;
const numberOfItemsDelay = 3;

async function responsibleForProcessing(
  perspective: PerspectiveProxy,
  neighbourhood: NeighbourhoodProxy,
  channelId: string,
  unprocessedItems: any[],
  increment = 0
): Promise<boolean> {
  // check if enough unprocessed items are present to run the processing task (increment used so we can keep checking the next item until the limit is reached)
  const enoughUnprocessedItems = unprocessedItems.length >= minNumberOfItemsToProcess + numberOfItemsDelay + increment;
  if (!enoughUnprocessedItems) {
    console.log("not enough items to process");
    return false;
  } else {
    // find the author of the nth item
    const nthItem = unprocessedItems[minNumberOfItemsToProcess + increment - 1];
    const author = await findItemsAuthor(perspective, channelId, nthItem.baseExpression);
    // if we are the author, we are responsible for processing
    if (await isMe(author)) {
      console.log("we are the author of the nth item!");
      return true;
    } else {
      // if not, signal the author to check if they can process the items
      const authorCanProcessItems = await agentCanProcessItems(neighbourhood, author);
      console.log("author can process items:", authorCanProcessItems);
      // if they can, we aren't responsible for processing
      if (authorCanProcessItems) return false;
      else {
        // if they can't, re-run the check on the next item
        return await responsibleForProcessing(perspective, neighbourhood, channelId, unprocessedItems, increment + 1);
      }
    }
  }
}

async function findOrCreateNewConversation(perspective: PerspectiveProxy, channelId: string) {
  const conversations = await Conversation.query(perspective, { source: channelId });
  if (conversations.length) {
    // if existing conversations found & last item in last conversation less than 30 mins old, use that conversation
    const lastConversation = conversations[conversations.length - 1];
    const lastConversationItems = await getSynergyItems(perspective, lastConversation.baseExpression);
    if (lastConversationItems.length) {
      const lastItem = lastConversationItems[lastConversationItems.length - 1];
      const timeSinceLastItemCreated = new Date().getTime() - new Date(lastItem.timestamp).getTime();
      const minsSinceLastItemCreated = timeSinceLastItemCreated / (1000 * 60);
      if (minsSinceLastItemCreated < 30) return lastConversation;
    }
  }
  // otherwise create a new conversation
  const newConversation = new Conversation(perspective, undefined, channelId);
  newConversation.conversationName = "Generating conversation...";
  await newConversation.save();
  return await newConversation.get();
}

// todo:
// + gather up save, update, and link creating tasks (after conversation creation) and run all in Promise.all() at function end (be aware that some need baseExpressions of previously created subject classes)
// + let other agents know when you have started & finished processing (add new signal in responsibleForProcessing check?)
// + mark individual items as processing in UI
let processing = false;
async function processItemsAndAddToConversation(perspective, channelId, unprocessedItems) {
  processing = true;
  const conversation: any = await findOrCreateNewConversation(perspective, channelId);
  // gather up all new perspective links so they can be commited in a single transaction at the end of the function
  const newLinks = [] as any;
  // prepare links connecting items to conversation
  newLinks.push(
    ...unprocessedItems.map((item) => ({
      source: conversation.baseExpression,
      predicate: "ad4m://has_child",
      target: item.baseExpression,
    }))
  );
  // gather up data for LLM processing
  const previousSubgroups = await ConversationSubgroup.query(perspective, { source: conversation.baseExpression });
  const lastSubgroup = previousSubgroups[previousSubgroups.length - 1];
  const lastSubgroupTopics = lastSubgroup ? await findTopics(perspective, lastSubgroup.baseExpression) : [];
  const lastSubgroupWithTopics = lastSubgroup ? { ...lastSubgroup, topics: lastSubgroupTopics } : null;
  const existingTopics = await getAllTopics(perspective);
  // run LLM processing
  const { conversationData, currentSubgroup, newSubgroup } = await LLMProcessing(
    unprocessedItems,
    previousSubgroups,
    lastSubgroupWithTopics,
    existingTopics
  );
  // update conversation text
  conversation.conversationName = conversationData.name;
  conversation.summary = conversationData.summary;
  await conversation.update();
  // gather up topics returned from LLM
  const allReturnedTopics = [];
  if (currentSubgroup) allReturnedTopics.push(...currentSubgroup.topics);
  if (newSubgroup) allReturnedTopics.push(...newSubgroup.topics);
  // filter out duplicates & existing topics
  const newTopicsToCreate = allReturnedTopics.reduce((acc, topic) => {
    const unique = !acc.some((t) => t.name === topic.name) && !existingTopics.some((t) => t.name === topic.name);
    if (unique) acc.push(topic);
    return acc;
  }, []);
  // create new topics and store them in newTopics array for later use
  const newTopics = await Promise.all(
    newTopicsToCreate.map(async (topic: any) => {
      // create topic
      const newTopic = new Topic(perspective);
      newTopic.topic = topic.name;
      await newTopic.save();
      const newTopicEntity = await newTopic.get();
      return { baseExpression: newTopicEntity.baseExpression, name: topic.name };
    })
  );
  // link all returned topics to conversation
  const conversationTopics = await findTopics(perspective, conversation.baseExpression);
  await Promise.all(
    allReturnedTopics.map(async (topic) => {
      // skip topics already linked to the conversation
      if (conversationTopics.find((t) => t.name === topic.name)) return;

      // find topic entity to get baseExpression
      const topicEntity =
        newTopics.find((t) => t.name === topic.name) || existingTopics.find((t) => t.name === topic.name);

      await linkTopic(perspective, conversation.baseExpression, topicEntity.baseExpression, topic.relevance);
    })
  );
  // update currentSubgroup if new data returned from LLM
  const currentSubgroupEntity = previousSubgroups[previousSubgroups.length - 1] as any;
  if (currentSubgroup) {
    currentSubgroupEntity.subgroupName = currentSubgroup.name;
    currentSubgroupEntity.summary = currentSubgroup.summary;
    // link currentSubgroup topics
    await Promise.all(
      currentSubgroup.topics.map(async (topic) => {
        const topicEntity =
          newTopics.find((t) => t.name === topic.name) || existingTopics.find((t) => t.name === topic.name);
        await linkTopic(perspective, currentSubgroupEntity.baseExpression, topicEntity.baseExpression, topic.relevance);
      })
    );
  }
  // create new subgroup if returned from LLM
  let newSubgroupEntity;
  if (newSubgroup) {
    newSubgroupEntity = new ConversationSubgroup(perspective, undefined, conversation.baseExpression);
    newSubgroupEntity.subgroupName = newSubgroup.name;
    newSubgroupEntity.summary = newSubgroup.summary;
    await newSubgroupEntity.save();
    newSubgroupEntity = await newSubgroupEntity.get();
    // prepare link connecting subgroup to conversation
    newLinks.push({
      source: conversation.baseExpression,
      predicate: "ad4m://has_child",
      target: newSubgroupEntity.baseExpression,
    });
    // link new subgroup topics
    await Promise.all(
      newSubgroup.topics.map(async (topic) => {
        const topicEntity =
          newTopics.find((t) => t.name === topic.name) || existingTopics.find((t) => t.name === topic.name);
        await linkTopic(perspective, newSubgroupEntity.baseExpression, topicEntity.baseExpression, topic.relevance);
      })
    );
  }
  // link items to subgroups
  const indexOfFirstItemInNewSubgroup =
    newSubgroup && unprocessedItems.findIndex((item) => item.id === newSubgroup.firstItemId);
  for (const [itemIndex, item] of unprocessedItems.entries()) {
    const itemsSubgroup =
      newSubgroup && itemIndex >= indexOfFirstItemInNewSubgroup ? newSubgroupEntity : currentSubgroupEntity;

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
    await removeEmbedding(perspective, currentSubgroupEntity.baseExpression);
    await createEmbedding(perspective, currentSubgroup.summary, currentSubgroupEntity.baseExpression);
  }
  // create vector embedding for new subgroup if returned from LLM
  if (newSubgroup) await createEmbedding(perspective, newSubgroup.summary, newSubgroupEntity.baseExpression);
  // batch commit all new links (currently only "ad4m://has_child" links)
  await perspective.addLinks(newLinks);
  processing = false;
}

export async function runProcessingCheck(perspective: PerspectiveProxy, channelId: string) {
  console.log("runProcessingCheck");
  // only attempt processing if default LLM is set
  if (await getDefaultLLM()) return;

  // check if we are responsible for processing
  const channelItems = await getSynergyItems(perspective, channelId);
  const unprocessedItems = await findUnprocessedItems(perspective, channelItems);
  const neighbourhood = await perspective.getNeighbourhoodProxy();
  const responsible: boolean = await responsibleForProcessing(perspective, neighbourhood, channelId, unprocessedItems);
  console.log("responsible for processing", responsible);
  // if we are responsible, process items (minus delay) & add to conversation
  if (responsible && !processing)
    await processItemsAndAddToConversation(perspective, channelId, unprocessedItems.slice(0, -numberOfItemsDelay));
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
