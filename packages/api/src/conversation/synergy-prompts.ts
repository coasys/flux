const VERSION = 2;

export const synergyConversationPrompt = `
You are here as an integrated part of a chat system - you're answers will be directly parsed by JSON.parse().
So make sure to always (!) respond with valid JSON!!

I'm passing you a JSON array consisting of object with the following properties:
1. 'n' (name)
2. 's' (summary)

These are describing sub-groups of a conversation.
I want you to give me a title and summary of the whole conversation, in the same format of { "n": "The Name/Title", "s": "This is a more descriptive summary..."}.

Make sure your response is in a format that can be parsed using JSON.parse(). Don't wrap it in code syntax. Don't append text outside of quotes. And don't use the assign operator ("=").
Include exactly the mentioned properties above. Nothing else, and don't miss any property!
If you make a mistake and I can't parse your output, I will give you the same input again, plus another field "jsonParseError" holding the error we got from JSON.parse().
So if you see that field, take extra care about that specific mistake and don't make it again!
Don't talk about the errors in the summaries or topics.
`;

export const synergyConversationExamples = [
  {
    input: `[
        {
            "n": "Tech and Privacy",
            "s": "Discussion about how emerging technologies impact user privacy and the ethical implications of data collection."
        },
        {
            "n": "AI in Healthcare",
            "s": "Exploration of the applications of artificial intelligence in healthcare, including diagnostics and patient management."
        },
        {
            "n": "Future of Work",
            "s": "Conversation about how remote work and automation are shaping the future of employment."
        }
    ]`,
    output: `{
        "n": "Technology and Society",
        "s": "The conversation examines the impact of technology on privacy, healthcare, and the future of work, highlighting ethical considerations and societal changes."
    }`,
  },
];

export const synergyGroupingPrompt = `
You are here as an integrated part of a chat system - you're answers will be directly parsed by JSON.parse().
So make sure to always (!) respond with valid JSON!!

I'm passing you a JSON object with two properties:
1. 'group' (Object with "n" (name), and "s" (summary))
2. 'unprocessedItems' (Object array of new messages. Each unprocessed item is a javascript object with an 'id' property (string) and a 'text' property (string))

Your task is to process the new messages into the ongoing conversation. 
This includes 2 aspects:
1. Updating the name and summary of the existing group
2. Detecting if and when (with which new item) the conversation has shifted so much that we need to create a new group.

I want you to respond with (only!) a JSON object with these properties:
1. 'group' (Object with 'name' and 'summary' of the current subgroup after including new items)
3. 'newGroup' (only present in the case of subject shift. object with 'n' (name), 's' (summary), and 'firstItemId' of the new subgroup spawned by a shift of the conversation in the new items)

In case where the conversation has shifted, generate a 'newGroup' including the following properties:
1. 'n': name - a 1 to 3 word title (string) describing the contents of the subgroup.
2. 's': summary a 1 to 3 sentence paragraph (string) summary of the contents of the subgroup.
3. 'firstItemId': the 'id' of the first unprocessed item in the subgroup.

Consider the conversation as **related** if:
- The text in an unprocessed item discusses, contrasts, or expands upon themes present in the last unprocessed item.
- The text in an unprocessed item introduces new angles, comparisons, or opinions on the same topics discussed in the last unprocessed item (even if specific terms or phrases differ).
Only consider the conversation as having **shifted to a new subject** if:
- The text in an unprocessed item introduces entirely new topics, concepts, or themes that are not directly related to any topics discussed or implied in the last unprocessed item.
- The text in an unprocessed item does not logically connect or refer back to the themes in the last unprocessed item.
- The following messages actually reflect the acceptance of that topic shift.

If the given "group" is empty or not present, it means we have just started a new conversation and don't have a group yet.
In that case, always create a "newGroup" with all the items ("firstItemId" being the id of the first unprocessedItem).

Make sure your response is in a format that can be parsed using JSON.parse(). Don't wrap it in code syntax. Don't append text outside of quotes. And don't use the assign operator ("=").
Include exactly the mentioned properties above. Nothing else, and don't miss any property!
If you make a mistake and I can't parse your output, I will give you the same input again, plus another field "jsonParseError" holding the error we got from JSON.parse().
So if you see that field, take extra care about that specific mistake and don't make it again!
Don't talk about the errors in the summaries or topics.
`;

export const synergyGroupingExamples = [
  {
    input: `{
    "group": null,
    "unprocessedItems": [
      { "id": "1", "text": "The universe is constantly expanding, but scientists are still debating the exact rate." },
      { "id": "2", "text": "Dark energy is thought to play a significant role in driving the expansion of the universe." },
      { "id": "3", "text": "Recent measurements suggest there may be discrepancies in the Hubble constant values." },
      { "id": "4", "text": "These discrepancies might point to unknown physics beyond our current models." },
      { "id": "5", "text": "For instance, some theories suggest modifications to general relativity could explain this." }
    ]
  }`,
    output: `{
    "group": null,
    "newGroup": {
      "n": "Cosmic Expansion",
      "s": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and possible new physics such as modifications to general relativity.",
      "firstItemId": "1"
    }
  }`,
  },
  {
    input: `{
    "group": {
      "n": "Cosmic Expansion",
      "s": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and possible new physics such as modifications to general relativity.",
    },
    "unprocessedItems": [
      { "id": "6", "text": "The cosmic microwave background also helps refine our estimates of the Hubble constant." },
      { "id": "7", "text": "Its measurements are among the most precise but still leave room for debate about the true value." },
      { "id": "8", "text": "By the way, a great way to bring out flavors in vegetables is to roast them with a mix of olive oil, garlic, and herbs." },
      { "id": "9", "text": "Caramelization from roasting adds depth to vegetables like carrots and Brussels sprouts." },
      { "id": "10", "text": "And don’t forget to season generously with salt and pepper before baking!" }
    ]
  }`,
    output: `{
    "group": {
      "n": "Cosmic Expansion",
      "s": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and precise measurements like those from the cosmic microwave background.",
    },
    "newGroup": {
      "n": "Vegetable Roasting",
      "s": "Tips for enhancing vegetable flavors by roasting them with olive oil, garlic, herbs, and seasoning to achieve caramelization and depth.",
      "firstItemId": "8",
    }
  }`,
  },
  {
    input: `{
    "group": {
      "n": "Tech and Privacy",
      "s": "Discussion about how emerging technologies impact user privacy and the ethical implications of data collection.",
    },
    "unprocessedItems": [
      { "id": "6", "text": "Many companies are adopting privacy-first approaches to regain user trust." },
      { "id": "7", "text": "However, balancing innovation and privacy often creates challenges for developers." },
      { "id": "8", "text": "On another note, effective team collaboration relies heavily on clear communication and shared goals." },
      { "id": "9", "text": "Tools like Slack and Trello have made remote work more efficient by streamlining communication." },
      { "id": "10", "text": "Establishing regular check-ins and feedback loops further enhances team productivity." }
    ]
  }`,
    output: `{
    "group": {
      "n": "Tech and Privacy",
      "s": "Discussion about how emerging technologies impact user privacy and the ethical implications of data collection, including privacy-first approaches and challenges for developers.",
    },
    "newGroup": {
      "n": "Team Collaboration",
      "s": "Exploration of effective team collaboration, focusing on tools like Slack and Trello, and practices like regular check-ins to enhance productivity.",
      "firstItemId": "8"
    }
  }`,
  },
  {
    input: `{
    "group": {
      "n": "Fitness and Nutrition",
      "s": "Discussion about the importance of balanced nutrition in supporting fitness and overall health."
    },
    "unprocessedItems": [
      { "id": "6", "text": "A well-rounded fitness routine includes both cardio and strength training." },
      { "id": "7", "text": "Proper hydration is also essential for maximizing workout performance." },
      { "id": "8", "text": "Speaking of hydration, the mineral content in water can affect recovery times." },
      { "id": "9", "text": "For example, electrolyte-rich water helps replenish what is lost through sweat." },
      { "id": "10", "text": "This shows how nutrition and hydration are deeply connected to fitness results." }
    ]
  }`,
    output: `{
    "group": {
      "n": "Fitness and Nutrition",
      "s": "Discussion about the importance of balanced nutrition, hydration, and how the mineral content in water contributes to fitness recovery and performance."
    },
    "newSubgroup": null
  }`,
  },
];

export const synergyTopicsPrompt = `
You are here as an integrated part of a chat system - you're answers will be directly parsed by JSON.parse().
So make sure to always (!) respond with valid JSON!!
Do NOT explain yourself. If you're unsure, just give your best answer, in the requested JSON format.

I'm passing you a JSON object with the following properties:
1. 'topics' (Array of Objects like {n: "<topic name>", rel: 80})
2. 'messages' (Array of strings)

Your task is to update the list of topics, given the list of messages.
Return a maximum of 5 topics.
If you consider introducing a new topic, first check if we already have that topic in the list.
If a new topic is almost the same as an existing topic, keep the existing topic.

For each topic, give a relevance score between 0 and 100.
You might want to update the relevance score of existing topics.

Respond with one JSON array, consisting of topic objects (with properties "name" and "rel"), like so:

[ { "n": "universe", "rel": 90 }, { "n": "expansion", "rel": 100 }]

Make sure your response is valid JSON and can be parsed using JSON.parse(). Don't wrap it in code syntax. Don't append text outside of quotes. And don't use the assign operator ("=").
Include exactly the mentioned properties above. Nothing else, and don't miss any property!
If you make a mistake and I can't parse your output, I will give you the same input again, plus another field "jsonParseError" holding the error we got from JSON.parse().
So if you see that field, take extra care about that specific mistake and don't make it again!
Don't talk about the errors in the summaries or topics.
`;

export const synergyTopicsExamples = [
  {
    input: `{
    "topics": [
        { "n": "universe", "rel": 90 },
        { "n": "expansion", "rel": 100 },
        { "n": "darkenergy", "rel": 90 },
        { "n": "hubble", "rel": 80 },
        
    ],
    "messages": [
        "The universe is constantly expanding, but scientists are still debating the exact rate.",
        "Dark energy is thought to play a significant role in driving the expansion of the universe.",
        "Recent measurements suggest there may be discrepancies in the Hubble constant values.",
        "These discrepancies might point to unknown physics beyond our current models.",
        "For instance, some theories suggest modifications to general relativity could explain this."
      ]
    }`,
    output: `[
        { "n": "universe", "rel": 100 },
        { "n": "expansion", "rel": 100 },
        { "n": "darkenergy", "rel": 90 },
        { "n": "hubble", "rel": 80 },
        { "n": "relativity", "rel": 70 }
    ]`,
  },
  {
    input: `{
        "topics": [
            { "n": "fitness", "rel": 80 },
            { "n": "nutrition", "rel": 70 }
        ],
        "messages": [
            "Hydration is a key factor in maintaining fitness performance.",
            "Electrolytes in water support muscle function and recovery.",
            "A balanced diet is essential for recovery and energy levels.",
            "Strength training complements cardio for a well-rounded fitness routine.",
            "Proper hydration prevents cramps and fatigue during workouts."
        ]
    }`,
    output: `[
        { "n": "fitness", "rel": 90 },
        { "n": "nutrition", "rel": 80 },
        { "n": "hydration", "rel": 85 },
        { "n": "recovery", "rel": 75 },
        { "n": "electrolytes", "rel": 70 }
    ]`,
  },
  {
    input: `{
        "topics": [],
        "messages": [
          "<p>1</p>",
          "<p>2</p>",
          "<p>3</p>",
          "<p>4</p>",
          "<p>5</p>",
          "<p>6</p>",
          "<p>7</p>",
          "<p>8</p>",
          "<p>9</p>"
        ]
    }`,
    output: `[
        { "n": "counting", "rel": 90 },
        { "n": "test", "rel": 50 },
    ]`,
  },
];

export class FluxLLMTask {
    name: string;
    prompt: string;
    examples: {input: string, output: string}[];
    expectedOutputs?: string[];
    expectedOneOf?: string[];
    expectArray?: boolean;
    id?: string;
}

export const synergyTasks = {
  grouping: {
    name: "Flux grouping task" + VERSION,
    prompt: synergyGroupingPrompt,
    examples: synergyGroupingExamples,
    expectedOneOf: ["group", "newGroup"],
  } as FluxLLMTask,
  topics: {
    name: "Flux topics task" + VERSION,
    prompt: synergyTopicsPrompt,
    examples: synergyTopicsExamples,
    expectedArray: true,
  } as FluxLLMTask,
  conversation: {
    name: "Flux conversation task" + VERSION,
    prompt: synergyConversationPrompt,
    examples: synergyConversationExamples,
    expectedOutputs: ["n", "s"],
  } as FluxLLMTask,
};
