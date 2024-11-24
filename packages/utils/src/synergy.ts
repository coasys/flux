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
      const subgroupItems = await getSubgroupItems(
        perspective,
        latestSubgroup.id
      );
      // calculate time since last item was created
      const lastItemTimestamp =
        subgroupItems[subgroupItems.length - 1].timestamp;
      const minsSinceLastItemCreated =
        (new Date().getTime() - new Date(lastItemTimestamp).getTime()) /
        (1000 * 60);
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
  const relationshipRepo = (await new SubjectRepository(SemanticRelationship, {
    perspective,
    source: itemId,
  })) as any;
  return await relationshipRepo.create({
    expression: itemId,
    tag: topicId,
    relevance,
  });
}

async function LLMProcessing(
  newItem,
  latestSubgroups,
  latestSubgroupItems,
  allTopics,
  openAIKey?
) {
  console.log(
    "LLMProcessing: ",
    newItem,
    latestSubgroups,
    latestSubgroupItems,
    allTopics,
    openAIKey
  );
  if (openAIKey) {
    const prompt = `
      I'm passing you a JSON object with the following properties: 'lastGroupings' (string block broken up into sections by line breaks <br/>), 'lastMessages' (string array), 'newMessage' (string), and 'existingTopics' (string array).
      { lastGroupings: [${latestSubgroups.map((s) => s.summary).join(" <br/> ")}], lastMessages: [${latestSubgroupItems.map((si) => si.text).join(", ")}], newMessage: '${newItem.text}', existingTopics: [${allTopics.map((t) => t.name).join(", ")}] }
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
    const openai = new OpenAI({
      apiKey: openAIKey, // localStorage?.getItem("openAIKey") || "",
      dangerouslyAllowBrowser: true,
    });
    const result = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });
    console.log("Open AI response: ", result);
    const data = JSON.parse(result.choices[0].message.content || "");
    console.log("Parsed Open AI response: ", data);
    return data;
  } else {
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
    console.log("Task: ", task);
    if (task) {
      // console.log("Task: updating existing task");
      // task.promptExamples = examples;
      // task.systemPrompt = prompt;
      // await client.ai.updateTask(task.taskId, task);
      // console.log("Task: ", task);
    } else {
      console.log("Task: creating new task");
      task = await client.ai.addTask(
        "flux-synergy-task",
        "llama",
        prompt,
        examples
      );
    }

    const response = await client.ai.prompt(
      task.taskId,
      `{ previousSubgroups: [${latestSubgroups.map((s: any) => s.summary).join(" <br/> ")}], previousMessages: [${latestSubgroupItems.map((si: any) => si.text).join(", ")}], newMessage: '${newItem.text}', existingTopics: [${allTopics.map((t: any) => t.name).join(", ")}] }`
    );
    console.log("AI Response: ", response);
    const data = JSON.parse(response);
    console.log("parsed AI response: ", data);
    if (!data.newConversationName) data.newConversationName = "";
    if (!data.newConversationSummary) data.newConversationSummary = "";
    if (!data.newSubgroupName) data.newSubgroupName = "";
    if (!data.newSubgroupSummary) data.newSubgroupSummary = "";
    if (!data.topics) data.topics = [];
    if (!data.changedSubject) data.changedSubject = false;
    console.log("checked data: ", data);
    return data;
  }

  // // tag generation
  // const tagPrompt = `
  //   I'm passing you a JSON object with 2 properties: 'existingTags' (string array) and 'newMessage' (string).

  //   I want you to analyse the 'newMessage' string and identify between 1 and 5 topic tags based on its content. Each tag should be a lower case single word string.

  //   If any of the tags are close to strings in the 'existingTags' array, reuse the existing tag instead of creating a new one. For example, if 'sports' is in the 'existingTags' array and one of the new tags you would generated is 'sport', reuse 'sports' instead of using 'sport' so we can match them up and avoid unnecissary duplicates.

  //   Additionaly, for each tag I also want you to provide a relevance score between 0 and 100 (0 being irrelevant and 100 being highly relevant) that indicates how relevant the tag is to the content of the 'newMessage' string.

  //   Finally return an array of objects for each of the tags you have identified for the 'newMessage' and nothing else. Each object should contain a 'name' property (string) for the name of the tag and a 'relevance' property (number) for its relevance score.

  //   Make sure the response is in a format that can be parsed using JSON.parse(). i.e don't wrap it in code syntax and use double quotes around both keys and string values.
  // `;
  // const tagExamples = [
  //   {
  //     input: `{ existingTags: [], newMessage: "Hello world!" }`,
  //     output: `[{ "name": "greeting", "relevance": 95 }, { "name": "hello", "relevance": 92 }, { "name": "world", "relevance": 83 }]`,
  //   },
  //   {
  //     input: `{ existingTags: ["greeting", "hello", "world"], newMessage: "Hey, how are you doing? Shall we start the meeting?" }`,
  //     output: `[{ "name": "greeting", "relevance": 86 }, { "name": "question", "relevance": 64 }, { "name": "meeting", "relevance": 78 }]`,
  //   },
  //   {
  //     input: `{ existingTags: ["greeting", "hello", "world", "question", "meeting"], newMessage: "Ok, let's get started. What do you make of the latest AI updates? I think they could improve our teams productivity significantly." }`,
  //     output: `[{ "name": "ai", "relevance": 92 }, { "name": "updates", "relevance": 75 }, { "name": "productivity", "relevance": 88 }, { "name": "team", "relevance": 76 }, { "name": "collaboration", "relevance": 57 }]`,
  //   },
  //   {
  //     input: `{ existingTags: ["sports", "music", "food", "science"], newMessage: "I'm going to a football match this weekend in Bristol. Do you want to join me? We could grab a bite to eat after." }`,
  //     output: `[{ "name": "football", "relevance": 92 }, { "name": "sports", "relevance": 70 }, { "name": "food", "relevance": 85 }, { "name": "bristol", "relevance": 90 }, { "name": "weekend", "relevance": 83 }]`,
  //   },
  //   {
  //     input: `{ existingTags: ["sports", "music", "food", "science"], newMessage: "I'm going to an event in Manchester next Thursday if the weather is good." }`,
  //     output: `[{ "name": "event", "relevance": 87 }, { "name": "manchester", "relevance": 90 }, { "name": "thursday", "relevance": 86 }, { "name": "weather", "relevance": 82 }]`,
  //   },
  // ];
  // // topic change check
  // const topicChangePrompt = `
  //   I'm passing you a JSON object with 2 properties: 'previousMessages' (string array) and 'newMessage' (string).

  //   I want you to compare the 'newMessage' string with the strings in the 'previousMessages' array and determine whether the topic of the conversation has changed.

  //   Only consider it to have changed if the flow of the conversation & its subject matter has clearly moved in a different direction.

  //   Return a boolean value and nothing else: true if the topic has shifted and false if it hasn't.
  // `;
  // const topicChangeExamples = [
  //   {
  //     input: `{ previousMessages: ["Hey John, how's things?"], newMessage: "Hey! Going great thanks." }`,
  //     output: `false`,
  //   },
  //   {
  //     input: `{ previousMessages: ["Hey John, how's things?", "Hey! Going great thanks."], newMessage: "I'm going to a football match this weekend in Bristol. Do you want to join me? We could grab a bite to eat after." }`,
  //     output: `true`,
  //   },
  //   {
  //     input: `{ previousMessages: ["I'm going to a football match this weekend in Bristol. Do you want to join me? We could grab a bite to eat after."], newMessage: "Yes, I'd love to join!" }`,
  //     output: `false`,
  //   },
  //   {
  //     input: `{ previousMessages: ["I'm going to a football match this weekend in Bristol. Do you want to join me? We could grab a bite to eat after.", "Yes, I'd love to join!"], newMessage: "Ok, what time should we meet before?" }`,
  //     output: `false`,
  //   },
  //   {
  //     input: `{ previousMessages: ["I'm going to a football match this weekend in Bristol. Do you want to join me? We could grab a bite to eat after.", "Yes, I'd love to join!"], newMessage: "Let's talk about the upcoming election." }`,
  //     output: `true`,
  //   },
  // ];
  // // subgroup name and summary
  // const subgroupPrompt = `
  //   I'm passing you a JSON object with 2 properties: 'previousMessages' (string array) and 'newMessage' (string).

  //   I want you to analyse the conversation and return a JSON object with 2 properties:

  //   1. 'newSubgroupName': a 1 to 3 word title (string) for the conversation.

  //   2. 'newSubgroupSummary': a 1 to 3 sentence paragraph (string) summary of the conents of the conversation.

  //   If there are no 'previousMessages' base the name and summary soley on the 'newMessage' string, otherwise base it on all the messages.

  //   Return only the JSON object and nothing else. Make sure your response is in a format that can be parsed using JSON.parse(). i.e don't wrap it in code syntax and use double quotes around both keys and string values. Also make sure the properties on the returned object match the property names listed above exactly.
  // `;
  // const subgroupExamples = [
  //   {
  //     input: `{ previousMessages: [], newMessage: "Hey John, how's things?" }`,
  //     output: `{ "newSubgroupName": "Greeting John", "newSubgroupSummary": "The first participant greets John and asks 'how's things?'." }`,
  //   },
  //   {
  //     input: `{ previousMessages: ["Hey John, how's things?"], newMessage: "Hey! Going great thanks." }`,
  //     output: `{ "newSubgroupName": "Friendly Greeting", "newSubgroupSummary": "The participants greet one another and check in with how each other are doing" }`,
  //   },
  //   {
  //     input: `{ previousMessages: ["I'm going to a football match this weekend in Bristol. Do you want to join me? We could grab a bite to eat after.", "Yes, I'd love to join!"], newMessage: "Ok, what time should we meet before?" }`,
  //     output: `{ "newSubgroupName": "Football and Food on the Weekend", "newSubgroupSummary": "The participants discuss meeting up to watch football and grab a bite to eat in Bristol over the weekend. They question what time to meet up before." }`,
  //   },
  //   {
  //     input: `{ previousMessages: ["One of the biggest risks with AI adoption in an economy dominated by private companies is that it will further accelerate wealth inequality", "Yeah, as companies replace their staff with AI the profits generated won't be redistibuted to those employees. Instead they'll be sucked up by the owners of those companies."], newMessage: "The only way around this that I can see would be to transition to a more cooperative economy where ownership of profits is more broadly distributed." }`,
  //     output: `{ "newSubgroupName": "AI, Wealth Inequality, and Transitioning to a Cooperative Economy", "newSubgroupSummary": "The risk of AI increasing wealth inequality in an economy dominated by private companies is discussed. Participants agree on the danger and propose solutions. Transitioning to a more cooperative economy is presented as a solution that could help distribute wealth more effectively" }`,
  //   },
  //   {
  //     input: `{ previousMessages: ["What's your favourite band?", "I'm quite into Magdalena Bay at the moment."], newMessage: "Oh yeah, I love their latest album. One of the best this year." }`,
  //     output: `{ "newSubgroupName": "Favourite Band: Magdalena Bay", "newSubgroupSummary": "Partcipants discuss their favourite band. One of them says they're quite into Magdalena Bay at the moment. The other agrees and says they love their latest album, which they think is one of the best this year." }`,
  //   },
  // ];
  // // conversation name and summary
  // const conversationPrompt = `
  //   I'm passing you a JSON object with 2 properties: 'previousSubgroups' (string array) and 'newSubgroup' (string).

  //   I want you to analyse the subgroups and return a JSON object with 2 properties:

  //   1. 'newConversationName': a 1 to 3 word title (string) for the conversation.

  //   2. 'newConversationSummary': a 1 to 3 sentence paragraph (string) summary of the conents of the conversation.

  //   If there are no 'previousSubgroups' base the name and summary soley on the 'newSubgroup' string, otherwise base it on all the subgroups.

  //   Return only the JSON object and nothing else. Make sure your response is in a format that can be parsed using JSON.parse(). i.e don't wrap it in code syntax and use double quotes around both keys and string values.
  // `;
  // const conversationExamples = [
  //   {
  //     input: `{ previousSubgroups: [], newSubgroup: "The participants greet one another and check in with how each other are doing." }`,
  //     output: `{ "newConversationName": "Friendly Greeting", "newConversationSummary": "The participants greet each other and discuss how they are doing." }`,
  //   },
  //   {
  //     input: `{ previousSubgroups: ["The participants greet one another and check in with how each other are doing."], newSubgroup: "The participants discuss meeting up to watch football and grab a bite to eat in Bristol over the weekend. They question what time to meet up before." }`,
  //     output: `{ "newConversationName": "Greetings and Weekend Plans to Watch Football", "newConversationSummary": "The participants greet each other and discuss meeting up to watch football in Bristol on Weekend. They also consider grabbing a bite to eat and question what time they should meet up before." }`,
  //   },
  //   {
  //     input: `{ previousSubgroups: ["The participants greet one another and check in with how each other are doing.", "The participants discuss meeting up to watch football and grab a bite to eat in Bristol over the weekend. They question what time to meet up before."], newSubgroup: "The risk of AI increasing wealth inequality in an economy dominated by private companies is discussed. Participants agree on the danger and propose solutions. Transitioning to a more cooperative economy is presented as a solution that could help distribute wealth more effectively" }`,
  //     output: `{ "newConversationName": "Greetings, Weekend Plans, and the Risks of AI Increasing Wealth Inequality", "newConversationSummary": "The participants greet each other and discuss meeting up to watch football in Bristol on Weekend. They consider grabbing a bite to eat and question what time they should meet up before. After this they discuss the risk of AI increasing wealth inequality in an economy dominated by private companies and propose transitioning to a more cooperative economy as the solution." }`,
  //   },
  // ];
  // // tasks
  // const client: Ad4mClient = await getAd4mClient();
  // const tasks = await client.ai.tasks();
  // const tagTask =
  //   tasks.find((t) => t.name === "tag-task") || (await client.ai.addTask("tag-task", "llama", tagPrompt, tagExamples));
  // const topicChangeTask =
  //   tasks.find((t) => t.name === "topic-change-task") ||
  //   (await client.ai.addTask("topic-change-task", "llama", topicChangePrompt, topicChangeExamples));
  // const subgroupTask =
  //   tasks.find((t) => t.name === "subgroup-task") ||
  //   (await client.ai.addTask("subgroup-task", "llama", subgroupPrompt, subgroupExamples));
  // const conversationTask =
  //   tasks.find((t) => t.name === "conversation-task") ||
  //   (await client.ai.addTask("conversation-task", "llama", conversationPrompt, conversationExamples));
  // console.log("tagTask", tagTask);
  // // tag, topic change, & sungroup processing
  // const tagResponse = await client.ai.prompt(
  //   tagTask.taskId,
  //   `{ existingTags: [${allTopics.map((t) => t.name).join(", ")}], newMessage: ${newItem.text} }`
  // );
  // console.log("tagResponse", tagResponse);
  // const topicChangeResponse = await client.ai.prompt(
  //   topicChangeTask.taskId,
  //   `{ previousMessages: [${latestSubgroupItems.map((si) => si.text).join(", ")}], newMessage: ${newItem.text} }`
  // );
  // console.log("topicChangeResponse", topicChangeResponse);
  // const subgroupResponse = await client.ai.prompt(
  //   subgroupTask.taskId,
  //   `{ previousMessages: [${latestSubgroupItems.map((si) => si.text).join(", ")}], newMessage: ${newItem.text} }`
  // );
  // console.log("subgroupResponse", subgroupResponse);
  // const tags = JSON.parse(tagResponse);
  // const changedSubject = JSON.parse(topicChangeResponse);
  // const { newSubgroupName, newSubgroupSummary } = JSON.parse(subgroupResponse);
  // // conversation processing
  // const conversationResponse = await client.ai.prompt(
  //   conversationTask.taskId,
  //   `{ previousSubgroups: [${latestSubgroups.map((s) => s.summary).join(" <br/> ")}], newSubgroup: ${newSubgroupSummary} }`
  // );
  // console.log("conversationResponse", conversationResponse);
  // let newConversationName,
  //   newConversationSummary = "";
  // try {
  //   const parsed = JSON.parse(conversationResponse);
  //   newConversationName = parsed.newConversationName;
  //   newConversationSummary = parsed.newConversationSummary;
  // } catch (e) {
  //   console.error("Parsing error", e);
  // }

  // return {
  //   topics: tags,
  //   changedSubject,
  //   newSubgroupName: newSubgroupName || "",
  //   newSubgroupSummary: newSubgroupSummary || "",
  //   newConversationName: newConversationName || "",
  //   newConversationSummary: newConversationSummary || "",
  // };
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
  return await new SubjectRepository(SemanticRelationship, {
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
          resolve({
            id: r.tag,
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
  console.log("processItem: ", item);
  return new Promise(async (resolve: any) => {
    // check for existing relationships & removed processed data if present (used for edits)
    const relationships = await findRelationships(perspective, item.id);
    if (relationships.length) await removeProcessedData(perspective, item.id);
    // grab all the necissary conversation data
    const conversationRepo = await new SubjectRepository(Conversation, {
      perspective,
      source: channelId,
    });
    const { conversations, latestSubgroups, latestSubgroupItems } =
      await getConversationData(perspective, conversationRepo);
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
    } = await LLMProcessing(
      item,
      latestSubgroups,
      latestSubgroupItems,
      allTopics
    );
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
            const topicId = await findOrCreateTopic(
              perspective,
              allTopics,
              topic.name
            );
            // link topic to new item
            await linkTopic(perspective, item.id, topicId, topic.relevance);
            // find conversation topics
            const conversationRelationships = await findRelationships(
              perspective,
              conversation.id
            );
            const conversationTopics = await findTopics(
              perspective,
              conversationRelationships
            );
            if (!conversationTopics.find((t) => t.name === topic.name)) {
              // link topic to conversation if not already linked
              await linkTopic(
                perspective,
                conversation.id,
                topicId,
                topic.relevance
              );
            }
            // find subgroup topics
            const subgroupRelationships = await findRelationships(
              perspective,
              subgroup.id
            );
            const subgroupTopics = await findTopics(
              perspective,
              subgroupRelationships
            );
            if (!subgroupTopics.find((t) => t.name === topic.name)) {
              // link topic to subgroup if not already linked
              await linkTopic(
                perspective,
                subgroup.id,
                topicId,
                topic.relevance
              );
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
    const conversationEmbedding = await generateEmbedding(
      newConversationSummary
    );
    await saveEmbedding(perspective, conversation.id, conversationEmbedding);
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
