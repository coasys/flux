const VERSION = 3;

export const synergyConversationPrompt = `
You are here as an integrated part of a chat system - you're answers will be directly parsed by JSON.parse().
So make sure to always (!) respond with valid JSON!!

I'm passing you a JSON array consisting of object with the following properties:
1. 'n' (name)
2. 's' (summary)

These are describing sub-groups of a conversation.
I want you to give me a title and summary of the whole conversation, in the same format of { "n": "The Name/Title", "s": "This is a more descriptive summary..."}.

Respond ONLY with JSON.
If I can't parse it, I'll ask you again and add a field: "avoidError" holding the parse error.
If you see this, take extra care to avoid that error! 
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
You are an API, receiving JSON and responding with JSON only.

In each message, I'm passing you a JSON object like this:
{
  "group:" { "n": "Name of the Group", "s": "Summary of the content of this group"},
  "unprocessedItems:" [
    { "id": "1", "text": "The universe is constantly expanding, but scientists are still debating the exact rate." },
    { "id": "2", "text": "Dark energy is thought to play a significant role in driving the expansion of the universe." },
  ]
}

Your task is to look at the unprocssedItems and decide if that conversation is still subsumed under the group title,
or just expanding it somewhat, or if the topic changed completely.

Either return just an updated group like so:

{
  "group": {
    "n": "Cosmic Expansion",
    "s": "Discussion about the universe's expansion."
  }
}

or an updated group AND a new group, which also must include the ID of the first message of the new topic:

{
  "group": {
    "n": "Cosmic Expansion",
    "s": "Discussion about the universe's expansion"
  },
  "newGroup": {
    "n": "Dark Energy",
    "s": "Discussion about dark energy and it's role in cosmic expansion",
    "firstItemId": "2"
  }
}

Consider the conversation as **related** if:
- The text in an unprocessed item discusses, contrasts, or expands upon themes present in the last unprocessed item.
- The text in an unprocessed item introduces new angles, comparisons, or opinions on the same topics discussed in the last unprocessed item (even if specific terms or phrases differ).
Only consider the conversation as having **shifted to a new subject** if:
- The text in an unprocessed item introduces entirely new topics, concepts, or themes that are not directly related to any topics discussed or implied in the last unprocessed item.
- The text in an unprocessed item does not logically connect or refer back to the themes in the last unprocessed item.
- The following messages actually reflect the acceptance of that topic shift.

If the given "group" is empty or not present, it means we have just started a new conversation and don't have a group yet.
In that case, always create a "newGroup" with all the items ("firstItemId" being the id of the first unprocessedItem).

Respond ONLY with JSON.
If I can't parse it, I'll ask you again and add a field: "avoidError" holding the parse error.
If you see this, take extra care to avoid that error! 
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
];

export const synergyTopicsPrompt = `
You are an API, receiving JSON and responding with JSON only.

In each message, I'm passing you a JSON object like this:
{
  "topics": [
      { "n": "universe", "rel": 90 },
      { "n": "expansion", "rel": 100 },
      
  ],
  "messages": [
      "The universe is constantly expanding, but scientists are still debating the exact rate.",
      "Dark energy is thought to play a significant role in driving the expansion of the universe.",
      "Recent measurements suggest there may be discrepancies in the Hubble constant values.",
      "These discrepancies might point to unknown physics beyond our current models.",
      "For instance, some theories suggest modifications to general relativity could explain this."
    ]
  }

Your task is to update the list of topics, given the list of messages.
Return a maximum of 5 topics.
If you consider introducing a new topic, first check if we already have that topic in the list.
If a new topic is almost the same as an existing topic, keep the existing topic.

For each topic, give a relevance score between 0 and 100.
You might want to update the relevance score of existing topics.

Respond with one JSON array, consisting of topic objects (with properties "name" and "rel"), like so:

[ { "n": "universe", "rel": 90 }, { "n": "expansion", "rel": 100 }]

Respond ONLY with JSON.
If I can't parse it, I'll ask you again and add a field: "avoidError" holding the parse error.
If you see this, take extra care to avoid that error! 
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
];

export class FluxLLMTask {
  name: string;
  prompt: string;
  examples: { input: string; output: string }[];
  expectedOutputs?: string[];
  expectedOneOf?: string[];
  expectArray?: boolean;
  id?: string;
}

export const synergyTasks = {
  grouping: {
    name: `Flux Grouping Task (v${VERSION})`,
    prompt: synergyGroupingPrompt,
    examples: synergyGroupingExamples,
    expectedOneOf: ["group", "newGroup"],
  } as FluxLLMTask,
  topics: {
    name: `Flux Topics Task (v${VERSION})`,
    prompt: synergyTopicsPrompt,
    examples: synergyTopicsExamples,
    expectArray: true,
  } as FluxLLMTask,
  conversation: {
    name: `Flux Conversation Task (v${VERSION})`,
    prompt: synergyConversationPrompt,
    examples: synergyConversationExamples,
    expectedOutputs: ["n", "s"],
  } as FluxLLMTask,
};
