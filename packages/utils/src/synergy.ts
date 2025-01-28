import { LinkQuery, PerspectiveExpression, NeighbourhoodProxy, PerspectiveProxy } from "@coasys/ad4m";
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
import { v4 as uuidv4 } from "uuid";
import { sleep } from "./sleep";
import { TopicWithRelevance } from "@coasys/flux-api/src/topic";

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

export async function findTopics(perspective, itemId): Promise<TopicWithRelevance[]> {
  const allRelationships = (await SemanticRelationship.query(perspective, {
    source: itemId,
  })) as any;

  const topics: TopicWithRelevance[] = [];
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

export async function findUnprocessedItems(perspective: any, items: any[], allSubgroupIds: string[]) {
  const results = await Promise.all(
    items.map(async (item) => {
      const links = await perspective.get(
        new LinkQuery({ predicate: "ad4m://has_child", target: item.baseExpression })
      );
      // if the item has a parent link to a conversation we know it has been processed
      const isProcessed = links.some((link) => allSubgroupIds.includes(link.data.source));
      return isProcessed ? null : item;
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

async function onSignalReceived(
  expression: PerspectiveExpression,
  neighbourhood: NeighbourhoodProxy,
  setProcessing: any
) {
  const link = expression.data.links[0];
  const { author, data } = link;
  const { source, predicate, target } = data;

  if (predicate === "can-you-process-items") {
    const defaultLLM = await getDefaultLLM();
    console.log(`Signal recieved: can you process items? (${defaultLLM ? "yes" : "no"})`);
    if (defaultLLM)
      await neighbourhood.sendSignalU(author, {
        links: [{ source: "", predicate: "i-can-process-items", target }],
      });
  }

  if (predicate === "i-can-process-items") {
    console.log(`Signal recieved: remote agent ${author} can process items!`);
    receivedSignals.push(link);
  }

  if (predicate === "processing-items-started") {
    const items = JSON.parse(target);
    console.log(`Signal recieved: ${items.length} items being processed by ${author}`);
    processing = true;
    setProcessing({ author, channel: source, items });
  }

  if (predicate === "processing-items-finished") {
    console.log(`Signal recieved: ${author} finished processing items`);
    processing = false;
    setProcessing(null);
  }
}

export async function addSynergySignalHandler(perspective: PerspectiveProxy, setProcessing: any) {
  const neighbourhood = await perspective.getNeighbourhoodProxy();
  signalHandler = (expression: PerspectiveExpression) => onSignalReceived(expression, neighbourhood, setProcessing);
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
const minItemsToProcess = 5;
const maxItemsToProcess = 20;
const numberOfItemsDelay = 3;

async function responsibleForProcessing(
  perspective: PerspectiveProxy,
  neighbourhood: NeighbourhoodProxy,
  channelId: string,
  unprocessedItems: any[],
  increment = 0
): Promise<boolean> {
  // check if enough unprocessed items are present to run the processing task (increment used so we can keep checking the next item until the limit is reached)
  const enoughUnprocessedItems = unprocessedItems.length >= minItemsToProcess + numberOfItemsDelay + increment;
  if (!enoughUnprocessedItems) {
    console.log("not enough items to process");
    return false;
  } else {
    // find the author of the nth item
    const nthItem = unprocessedItems[minItemsToProcess + increment - 1];
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

async function findOrCreateNewConversation(perspective: PerspectiveProxy, channelId: string): Promise<Conversation> {
  const conversations = (await Conversation.query(perspective, { source: channelId })) as Conversation[];
  if (conversations.length) {
    // if existing conversations found & last item in last conversation subgroup less than 30 mins old, use that conversation
    const lastConversation = conversations[conversations.length - 1];
    const conversationSubgroups = await lastConversation.subgroups();
    if (conversationSubgroups.length) {
      const lastSubgroup = conversationSubgroups[conversationSubgroups.length - 1] as ConversationSubgroup;
      const lastSubgroupItems = await getSynergyItems(perspective, lastSubgroup.baseExpression);
      if (lastSubgroupItems.length) {
        const lastItem = lastSubgroupItems[lastSubgroupItems.length - 1];
        const timeSinceLastItemCreated = new Date().getTime() - new Date(lastItem.timestamp).getTime();
        const minsSinceLastItemCreated = timeSinceLastItemCreated / (1000 * 60);
        if (minsSinceLastItemCreated < 30) return lastConversation;
      } else {
        // existing conversation with an existing but empty last group
        // this should not happen
        // but if this is the case, we will just take the timestamp of that group
        const timeSinceLastSubgroupCreated = new Date().getTime() - new Date(lastSubgroup.timestamp).getTime();
        const minsSinceLastSubgroupCreated = timeSinceLastSubgroupCreated / (1000 * 60);
        if (minsSinceLastSubgroupCreated < 30) return lastConversation;
      }
    } else {
      // empty conversation, use it
      return lastConversation;
    }
  }
  // otherwise create a new conversation
  const newConversation = new Conversation(perspective, undefined, channelId);
  newConversation.conversationName = "Generating conversation...";
  await newConversation.save();
  return await newConversation.get();
}

export async function findAllChannelSubgroupIds(
  perspective: PerspectiveProxy,
  conversations: Conversation[]
): Promise<string[]> {
  const subgroups = await Promise.all(
    conversations.map((conversation) =>
      ConversationSubgroup.query(perspective, { source: conversation.baseExpression })
    )
  );
  return [...new Set(subgroups.flat().map((subgroup) => subgroup.baseExpression))];
}

let processing = false;
export async function runProcessingCheck(perspective: PerspectiveProxy, channelId: string, setProcessing: any) {
  console.log("runProcessingCheck");
  // only attempt processing if default LLM is set
  if (!(await getDefaultLLM())) return;

  // check if we are responsible for processing
  const channelItems = await getSynergyItems(perspective, channelId);
  const conversations = (await Conversation.query(perspective, { source: channelId })) as any;
  const allSubgroupIds = await findAllChannelSubgroupIds(perspective, conversations);
  const unprocessedItems = await findUnprocessedItems(perspective, channelItems, allSubgroupIds);
  const neighbourhood = await perspective.getNeighbourhoodProxy();
  const responsible: boolean = await responsibleForProcessing(perspective, neighbourhood, channelId, unprocessedItems);
  console.log("responsible for processing", responsible);
  // if we are responsible, process items & add to conversation
  if (responsible && !processing) {
    const client = await getAd4mClient();
    const me = await client.agent.me();
    const numberOfItemsToProcess = Math.min(maxItemsToProcess, unprocessedItems.length - numberOfItemsDelay);
    const itemsToProcess = unprocessedItems.slice(0, numberOfItemsToProcess);
    const itemIds = itemsToProcess.map((item) => item.baseExpression);
    processing = true;
    setProcessing({ author: me.did, channel: channelId, items: itemIds });
    // notify other agents that we are processing
    await neighbourhood.sendBroadcastU({
      links: [{ source: channelId, predicate: "processing-items-started", target: JSON.stringify(itemIds) }],
    });

    const conversation = await findOrCreateNewConversation(perspective, channelId);
    try {
      await conversation.processNewExpressions(itemsToProcess);
    } catch (e) {
      console.log("Error processing items into conversation:" + e);
    }

    // update processing items state
    processing = false;
    setProcessing(null);
    // notify other agents
    await neighbourhood.sendBroadcastU({
      links: [{ source: channelId, predicate: "processing-items-finished", target: "" }],
    });
  }
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
