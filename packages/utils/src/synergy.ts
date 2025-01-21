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

async function removeTopics(perspective, itemId) {
  const allRelationships = (await SemanticRelationship.query(perspective, {
    source: itemId,
  })) as any;
  const topicRelationships = allRelationships.filter((r) => r.relevance);
  return Promise.all(
    topicRelationships.map(
      async (topicRelationship) =>
        new Promise(async (resolve: any) => {
          try {
            const topic = new Topic(perspective, topicRelationship.tag);
            await topic.delete();
            await topicRelationship.delete();
            resolve();
          } catch (error) {
            resolve();
          }
        })
    )
  );
}

async function removeProcessedData(perspective, itemId) {
  return await Promise.all([removeEmbedding(perspective, itemId), removeTopics(perspective, itemId)]);
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
  const taskPrompt = `
    You are here as an integrated part of a chat system - you're answers will be directly parsed by JSON.parse().
    So make sure to always (!) respond with valid JSON!!

    I'm passing you a JSON object with the following properties:
    1. 'existingTopics' (String array of all existing topic names)
    2. 'unprocessedItems' (Object array of all unprocessed items. Each unprocessed item is a javascript object with an 'id' property (string) and a 'text' property (string))
    3. 'subgroupSummaries' (String array of all subgroup summaries)

    Firstly, analyze the last summary in 'subgroupSummaries' and the 'text' property of each unprocessedItem to identify if the conversation has shifted to a new subject or not.
    Consider the conversation as **related** if:
    - The text in an unprocessed item discusses, contrasts, or expands upon themes present in the last unprocessed item.
    - The text in an unprocessed item introduces new angles, comparisons, or opinions on the same topics discussed in the last unprocessed item (even if specific terms or phrases differ).
    Only consider the conversation as having **shifted to a new subject** if:
    - The text in an unprocessed item introduces entirely new topics, concepts, or themes that are not directly related to any topics discussed or implied in the last unprocessed item.
    - The text in an unprocessed item does not logically connect or refer back to the themes in the last unprocessed item.
    If the 'subgroupSummaries' array is empty, consider the conversation as having immediately shifted.
    If the last summary in 'subgroupSummaries' array is unrelated to the text in the first unprocessed item, the conversation has also shifted.
    In every case where the conversation has shifted, generate a new subgroup including the following properties:
    1. 'name': a 1 to 3 word title (string) describing the contents of the subgroup.
    2. 'summary': a 1 to 3 sentence paragraph (string) summary of the contents of the subgroup.
    3. 'firstItemId': the 'id' of the first unprocessed item in the subgroup.
    4. 'topics': an array of between 1 and 5 topic objects indicating topics that are relevant to the contents of the subgroup (a bit like hashtags).
    Each topic object should including a 'name' property (a single word string in lowercase) for the name of the topic
    and a 'relevance' property (number) between 0 and 100 (0 being irrelevant and 100 being highly relevant) that indicates how relevant the topic is to the content of the text.
    If any of the topics you choose are similar to topics listed in the 'existingTopics' array, use the existing topic instead of creating 
    a new one (i.e. if one of the new topics you picked was 'foods' and you find an existing topic 'food', use 'food' instead of creating a new topic that is just a plural version of the existing topic).
    The output of this analysis will be a new 'subgroups' array conatining all of new subgroup objects you have generated.

    Secondly, if the first subgroup generated above comes after the first unprocessed item, we need to generate a new 'lastSubgroupData' object with the following properties:
    1. 'name': a 1 to 3 word title (string) describing the contents of the conversation.
    2. 'summary': a 1 to 3 sentence paragraph (string) summary of the contents of the conversation.
    3. 'topics': an array of between 1 and 5 topic objects indicating topics that are relevant to the contents of the conversation.

    Thirdly, analyse all the summaries in the original 'subgroupSummaries' array and the summaries in the new 'subgroups' array, and use this info to generate a new 'conversationData' object with the following properties:
    1. 'name': a 1 to 3 word title (string) describing the contents of the conversation.
    2. 'summary': a 1 to 3 sentence paragraph (string) summary of the contents of the conversation.

    Finally return a JSON object with the following properties generated from the analysis:
    1. 'subgroups': the 'subgroups' array described above.
    2. 'lastSubgroupData': 
    3. 'conversationData': the 'conversationData' object described above. 

    Make sure your response is in a format that can be parsed using JSON.parse(). Don't wrap it in code syntax. Don't append text outside of quotes. And don't use the assign operator ("=").
    If you make a mistake and I can't parse your output, I will give you the same input again, plus another field "jsonParseError" holding the error we got from JSON.parse().
    So if you see that field, take extra care about that specific mistake and don't make it again!
    Don't talk about the errors in the summaries or topics.
  `;

  const examples = [
    {
      input: `{
        "existingTopics": ["coding", "help"],
        "unprocessedItems": [
          {
            "id": "msg-1",
            "text": "I'm exploring a new Vue.js project",
            "timestamp": "2025-01-10T10:00:00.000Z"
          },
          {
            "id": "msg-2",
            "text": "Need help setting up TypeScript",
            "timestamp": "2025-01-10T10:01:00.000Z"
          }
        ],
        "subgroupSummaries": []
      }`,
      output: `{
        "conversationData": {
          "name": "Vue Setup",
          "summary": "Discusses initial steps in a Vue project and TypeScript configuration."
        },
        "itemsWithTopics": [
          {
            "id": "msg-1",
            "timestamp": "2025-01-10T10:00:00.000Z",
            "topics": [
              { "name": "coding", "relevance": 85 }
            ]
          },
          {
            "id": "msg-2",
            "timestamp": "2025-01-10T10:01:00.000Z",
            "topics": [
              { "name": "help", "relevance": 90 },
              { "name": "coding", "relevance": 70 }
            ]
          }
        ],
        "subgroups": [
          {
            "name": "Initial Setup",
            "summary": "Covers starting a Vue project and requesting TypeScript assistance.",
            "timestamp": "2025-01-10T09:59:59.999Z"
          }
        ]
      }`,
    },
    {
      input: `{
        "existingTopics": ["cooking", "recipe"],
        "unprocessedItems": [
          {
            "id": "msg-1",
            "text": "I'm making a chicken curry today",
            "timestamp": "2025-01-10T11:00:00.000Z"
          },
          {
            "id": "msg-2",
            "text": "I need a good spice blend for flavor",
            "timestamp": "2025-01-10T11:05:00.000Z"
          }
        ],
        "subgroupSummaries": [
          "We previously discussed favorite curry methods."
        ]
      }`,
      output: `{
        "conversationData": {
          "name": "Curry Tips",
          "summary": "Continues discussing chicken curry preparation and spice blends."
        },
        "itemsWithTopics": [
          {
            "id": "msg-1",
            "timestamp": "2025-01-10T11:00:00.000Z",
            "topics": [
              { "name": "cooking", "relevance": 90 }
            ]
          },
          {
            "id": "msg-2",
            "timestamp": "2025-01-10T11:05:00.000Z",
            "topics": [
              { "name": "cooking", "relevance": 85 },
              { "name": "recipe", "relevance": 75 }
            ]
          }
        ],
        "subgroups": []
      }`,
    },
    {
      input: `{
        "existingTopics": ["music", "lessons", "practice"],
        "unprocessedItems": [
          {
            "id": "msg-1",
            "text": "Continuing my piano exercises",
            "timestamp": "2025-01-10T12:00:00.000Z"
          },
          {
            "id": "msg-2",
            "text": "Scales and chords are getting easier",
            "timestamp": "2025-01-10T12:02:00.000Z"
          },
          {
            "id": "msg-3",
            "text": "Now I'm considering a shift to guitar",
            "timestamp": "2025-01-10T12:03:00.000Z"
          },
          {
            "id": "msg-4",
            "text": "Barre chords seem tough to master",
            "timestamp": "2025-01-10T12:04:00.000Z"
          }
        ],
        "subgroupSummaries": [
          "A discussion on chord progressions for piano.",
          "Notes on daily practice routines."
        ]
      }`,
      output: `{
        "conversationData": {
          "name": "Instrument Focus",
          "summary": "Begins with piano exercises and transitions into learning guitar techniques."
        },
        "itemsWithTopics": [
          {
            "id": "msg-1",
            "timestamp": "2025-01-10T12:00:00.000Z",
            "topics": [
              { "name": "practice", "relevance": 85 },
              { "name": "music", "relevance": 75 }
            ]
          },
          {
            "id": "msg-2",
            "timestamp": "2025-01-10T12:02:00.000Z",
            "topics": [
              { "name": "music", "relevance": 80 },
              { "name": "practice", "relevance": 70 }
            ]
          },
          {
            "id": "msg-3",
            "timestamp": "2025-01-10T12:03:00.000Z",
            "topics": [
              { "name": "music", "relevance": 90 }
            ]
          },
          {
            "id": "msg-4",
            "timestamp": "2025-01-10T12:04:00.000Z",
            "topics": [
              { "name": "music", "relevance": 85 },
              { "name": "lessons", "relevance": 60 }
            ]
          }
        ],
        "subgroups": [
          {
            "name": "Guitar Move",
            "summary": "Explores transitioning from piano to learning guitar chords.",
            "timestamp": "2025-01-10T12:02:59.999Z"
          }
        ]
      }`,
    },
    {
      input: `{
        "existingTopics": ["gaming", "strategy", "multiplayer"],
        "unprocessedItems": [
          {
            "id": "msg-1",
            "text": "I'm trying new tactics in a real-time strategy game",
            "timestamp": "2025-01-10T13:00:00.000Z"
          },
          {
            "id": "msg-2",
            "text": "Multiplayer matches can be stressful",
            "timestamp": "2025-01-10T13:01:00.000Z"
          },
          {
            "id": "msg-3",
            "text": "Switching gears to a solo RPG for a break",
            "timestamp": "2025-01-10T13:02:00.000Z"
          },
          {
            "id": "msg-4",
            "text": "Next, I want to try a puzzle platformer",
            "timestamp": "2025-01-10T13:03:00.000Z"
          },
          {
            "id": "msg-5",
            "text": "Co-op mode in platformers is fun too",
            "timestamp": "2025-01-10T13:04:00.000Z"
          }
        ],
        "subgroupSummaries": [
          "A previous note on game reviews.",
          "Summary of an intense strategy tournament.",
          "Discussion about team-based gaming experiences."
        ]
      }`,
      output: `{
        "conversationData": {
          "name": "Varied Gaming",
          "summary": "Covers real-time strategies, solo RPGs, and transitioning to puzzle platformers."
        },
        "itemsWithTopics": [
          {
            "id": "msg-1",
            "timestamp": "2025-01-10T13:00:00.000Z",
            "topics": [
              { "name": "strategy", "relevance": 90 },
              { "name": "gaming", "relevance": 70 }
            ]
          },
          {
            "id": "msg-2",
            "timestamp": "2025-01-10T13:01:00.000Z",
            "topics": [
              { "name": "multiplayer", "relevance": 85 },
              { "name": "gaming", "relevance": 65 }
            ]
          },
          {
            "id": "msg-3",
            "timestamp": "2025-01-10T13:02:00.000Z",
            "topics": [
              { "name": "gaming", "relevance": 80 }
            ]
          },
          {
            "id": "msg-4",
            "timestamp": "2025-01-10T13:03:00.000Z",
            "topics": [
              { "name": "gaming", "relevance": 75 }
            ]
          },
          {
            "id": "msg-5",
            "timestamp": "2025-01-10T13:04:00.000Z",
            "topics": [
              { "name": "multiplayer", "relevance": 70 },
              { "name": "gaming", "relevance": 60 }
            ]
          }
        ],
        "subgroups": [
          {
            "name": "Solo RPG",
            "summary": "Moves away from strategy towards a single-player role-playing experience.",
            "timestamp": "2025-01-10T13:01:59.999Z"
          },
          {
            "name": "Puzzle Platforming",
            "summary": "Shifts focus to platformer gameplay, including co-op elements.",
            "timestamp": "2025-01-10T13:02:59.999Z"
          }
        ]
      }`,
    },
  ];

  const client: Ad4mClient = await getAd4mClient();
  const tasks = await client.ai.tasks();
  let task = tasks.find((t) => t.name === "flux-synergy-task");
  if (!task) task = await client.ai.addTask("flux-synergy-task", "default", taskPrompt, examples);
  return task;
}

async function LLMProcessing(unprocessedItems, subgroups, existingTopics) {
  const task = await ensureLLMTask();
  const client: Ad4mClient = await getAd4mClient();
  let prompt = {
    existingTopics: existingTopics.map((t: any) => t.name),
    unprocessedItems: unprocessedItems.map((item: any) => {
      return { id: item.baseExpression, text: item.text, timestamp: item.timestamp };
    }),
    subgroupSummaries: subgroups.map((s: any) => s.summary),
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
      itemsWithTopics: parsedData.itemsWithTopics,
      subgroups: parsedData.subgroups,
    };
  } else {
    // give up and return empty data
    console.error("Failed to parse LLM response after 5 attempts. Returning empty data.");
    return {
      conversationData: { name: "", summary: "" },
      itemsWithTopics: [],
      subgroups: [],
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
  const topicRelationships = allRelationships.filter((r: any) => r.relevance);
  const topics = await Promise.all(
    topicRelationships.map(
      (r) =>
        new Promise(async (resolve) => {
          try {
            const topicEntity = new Topic(perspective, r.tag);
            const topic = await topicEntity.get();
            resolve({
              baseExpression: r.tag,
              name: topic.topic,
              relevance: r.relevance,
            });
          } catch (error) {
            resolve(null);
          }
        })
    )
  );
  return topics.filter((t) => t);
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
  return (
    await Promise.all(
      items.map(async (item) => {
        const parentLinks = await perspective.get(
          new LinkQuery({ predicate: "ad4m://has_child", target: item.baseExpression })
        );
        // unprocessed items should only have a single parent link to the channel (where as processed items will also have a parent link to the conversation)
        return parentLinks.length === 1 ? item : null;
      })
    )
  ).filter(Boolean);
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
  return new Promise(async (resolve) => {
    // generate a uuid to ensure responce matches request
    const signalUuid = uuidv4();
    // signal the agent to check they are online and have AI enabled
    await neighbourhood.sendSignalU(agentsDid, {
      links: [{ source: "", predicate: "can-you-process-items", target: signalUuid }],
    });
    // wait 2 seconds for a responce
    setTimeout(() => {
      const affirmationRecieved = !!receivedSignals.find((signal: any) => signal.data.target === signalUuid);
      resolve(affirmationRecieved);
    }, 3000);
  });
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
// + gather up save, update, and link creating tasks (after conversation creation) and run all in promise all at the end (but some need baseExpressions of created subject classes)
// + update last of previous subgroups if processed items are present before the first new subgroup (new title, summary, vector embedding, and new topics)
// + mark items as processing so visible in UI and other agents know not to process them (add new signal in responsibleForProcessing check?)
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
  // run LLM processing
  const previousSubgroups = await ConversationSubgroup.query(perspective, { source: conversation.baseExpression });
  const existingTopics = await getAllTopics(perspective);
  const { conversationData, itemsWithTopics, subgroups } = await LLMProcessing(
    unprocessedItems,
    previousSubgroups,
    existingTopics
  );
  // update conversation text
  conversation.conversationName = conversationData.name;
  conversation.summary = conversationData.summary;
  await conversation.update();
  // gather up topics from processed items (avoiding duplicates)
  const allReturnedTopics = itemsWithTopics
    .flatMap((item) => item.topics)
    .reduce((acc, topic) => {
      const exists = acc.some((t) => t.name === topic.name);
      if (!exists) acc.push(topic);
      return acc;
    }, []);
  // filter out existing topics
  const newTopicsToCreate = allReturnedTopics.filter((topic) => !existingTopics.some((t) => t.name === topic.name));
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
  // link all returned topics to channel
  const conversationTopics = await findTopics(perspective, conversation.baseExpression);
  await Promise.all(
    allReturnedTopics.map(
      (topic) =>
        new Promise(async (resolve: any) => {
          // skip topics already linked to the channel
          if (!conversationTopics.find((t) => t.name === topic.name)) {
            // find topic entity in newTopics or existingTopics arrays so we can get its baseExpression (not returned from LLM)
            const topicEntity =
              newTopics.find((t) => t.name === topic.name) || existingTopics.find((t) => t.name === topic.name);
            await linkTopic(perspective, conversation.baseExpression, topicEntity.baseExpression, topic.relevance);
          }
          resolve();
        })
    )
  );
  // create new subgroups
  const newSubgroups = await Promise.all(
    subgroups.map(async (subgroup) => {
      // create subgroup
      const newSubgroup = new ConversationSubgroup(perspective, undefined, conversation.baseExpression);
      newSubgroup.subgroupName = subgroup.name;
      newSubgroup.summary = subgroup.summary;
      newSubgroup.positionTimestamp = subgroup.timestamp;
      await newSubgroup.save();
      // prepare link connecting subgroup to channel
      newLinks.push({ source: channelId, predicate: "ad4m://has_child", target: newSubgroup.baseExpression });
      return newSubgroup.get();
    })
  );
  // gather up subgroup topics (avoiding duplicates)
  const subgroupsWithTopics = [] as any;
  // link topics to items & groups
  await Promise.all(
    itemsWithTopics.map(
      (item: any) =>
        new Promise(async (resolve: any) => {
          // find the items subgroup
          let itemsSubgroup = previousSubgroups[previousSubgroups.length - 1];
          const newSubgroupsBeforeItem = newSubgroups.filter(
            (s) => new Date(s.positionTimestamp).getTime() < new Date(item.timestamp).getTime()
          );
          if (newSubgroupsBeforeItem.length) {
            itemsSubgroup = newSubgroupsBeforeItem[newSubgroupsBeforeItem.length - 1];
          }
          // loop through each of the items topics, link them to the item & subgroup
          await Promise.all(
            item.topics.map(
              (topic: any) =>
                new Promise(async (resolve2: any) => {
                  // find topic entity
                  const topicEntity =
                    newTopics.find((t) => t.name === topic.name) || existingTopics.find((t) => t.name === topic.name);
                  // link topic to item
                  await linkTopic(perspective, item.id, topicEntity.baseExpression, topic.relevance);
                  // instead of linking the topic to the subgroup here, store subgroups & topics to be added later (avoiding duplicates)
                  let subgroupWithTopics = subgroupsWithTopics.find(
                    (s) => s.baseExpression === itemsSubgroup.baseExpression
                  );
                  if (!subgroupWithTopics) {
                    // if subgroup not found, create new subgroup with topic
                    subgroupsWithTopics.push({
                      baseExpression: itemsSubgroup.baseExpression,
                      topics: [{ ...topicEntity, relevance: topic.relevance }],
                    });
                  } else if (!subgroupWithTopics.topics.find((t) => t.name === topic.name)) {
                    // otherwise, if  add topic to existing subgroup
                    subgroupWithTopics.topics.push({ ...topicEntity, relevance: topic.relevance });
                  }
                  resolve2();
                })
            )
          );
          resolve();
        })
    )
  );
  // link topics to subgroups
  await Promise.all(
    subgroupsWithTopics.map(
      (subgroup: any) =>
        new Promise(async (resolve: any) => {
          const subgroupTopics = await findTopics(perspective, subgroup.baseExpression);
          await Promise.all(
            subgroup.topics.map(
              (topic) =>
                new Promise((resolve2: any) => {
                  if (!subgroupTopics.find((t) => t.name === topic.name)) {
                    linkTopic(perspective, subgroup.baseExpression, topic.baseExpression, topic.relevance);
                  }
                  resolve2();
                })
            )
          );
          resolve();
        })
    )
  );
  // create vector embeddings for each item
  await Promise.all(unprocessedItems.map((item) => createEmbedding(perspective, item.text, item.baseExpression)));
  // create vector embeddings for each new subgroup (todo: include last subgroup if processed items before first new subgroup)
  await Promise.all(
    newSubgroups.map((subgroup) => createEmbedding(perspective, subgroup.summary, subgroup.baseExpression))
  );
  // create new vector embedding for conversation
  await removeEmbedding(perspective, conversation.baseExpression);
  await createEmbedding(perspective, conversationData.summary, conversation.baseExpression);
  // batch commit all new links (currently only "ad4m://has_child" links)
  await perspective.addLinks(newLinks);
  processing = false;
}

// todo: needs to run every time a new item appears in a channel (not just every time you create a new item)
export async function runProcessingCheck(perspective: PerspectiveProxy, channelId: string) {
  console.log("runProcessingCheck");
  return new Promise(async (resolve: any) => {
    // only attempt processing if default LLM is set
    const defaultLLM = await getDefaultLLM();
    if (!defaultLLM) resolve();
    else {
      // check if we are responsible for processing
      const channelItems = await getSynergyItems(perspective, channelId);
      const unprocessedItems = await findUnprocessedItems(perspective, channelItems);
      const neighbourhood = await perspective.getNeighbourhoodProxy();
      const responsible: boolean = await responsibleForProcessing(
        perspective,
        neighbourhood,
        channelId,
        unprocessedItems
      );
      console.log("responsible for processing", responsible);
      // if we are responsible, process items (minus delay) & add to conversation
      if (responsible && !processing)
        await processItemsAndAddToConversation(perspective, channelId, unprocessedItems.slice(0, -numberOfItemsDelay));
      resolve();
    }
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
