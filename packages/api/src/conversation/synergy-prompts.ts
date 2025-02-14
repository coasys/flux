const VERSION = 4;

export const synergyConversationPrompt = `
You are an integrated part of a chat system. 

## **Critical Requirement:**
Your responses will be **directly parsed by JSON.parse()**.  
⚠️ **ALWAYS return valid JSON ONLY (!!)** ⚠️  
If your response is not valid JSON, it **WILL BREAK** the system.

---

## **Input Format:**
You will receive a list of existing conversation sub-groups - that is: their names and summaries.
I will provide these as clear-text with the name in one line and the summary in the next line.
There will be an empty line between each sub-group.

Example input:
Cosmic Expansion
Discussion about the universe's expansion.

Dark Matter
Exploring the mysterious substance influencing gravity.

---

## **Your Task:**
- Analyze all sub-group names (“n”) and summaries (“s”).
- Generate one single overarching title and summary that captures the whole conversation.
- Structure your response as ONE JSON object:

Example output:
{
  "n": "The Name/Title",
  "s": "This is a more descriptive summary..."
}

## **🚨 DO NOT:**
- Add extra properties.
- Use explanations, text, or natural language outside JSON.
- Return anything else than a single JSON object.

## ALWAYS:
- Return ONE single JSON object.
- With the properties "n" and "s".
`;

export const synergyConversationExamples = [
  {
    input: `
Tech and Privacy
Discussion about how emerging technologies impact user privacy and the ethical implications of data collection.

AI in Healthcare
Exploration of the applications of artificial intelligence in healthcare, including diagnostics and patient management.

Future of Work
Conversation about how remote work and automation are shaping the future of employment`,
    output: `{
        "n": "Technology and Society",
        "s": "The conversation examines the impact of technology on privacy, healthcare, and the future of work, highlighting ethical considerations and societal changes."
    }`,
  },
];

export const synergyGroupingPrompt = `
You are an API. You receive JSON input and respond ONLY with JSON output. 

## **Critical Requirement**:
⚠️ Your output **MUST** be valid JSON, as it will be parsed directly with JSON.parse().  
**DO NOT** include comments, explanations, or extra fields.


## Input Format:
You will receive a JSON object containing:
- A "group" object with:
  - "n": The name of the group
  - "s": A summary of the group topic
- A list called "unprocessedItems":
  - Each item has an "id" and "text".

Example input:
{
  "group": { "n": "Cosmic Expansion", "s": "Discussion about the universe's expansion." },
  "unprocessedItems": [
    { "id": "1", "text": "Dark energy is thought to play a significant role in driving expansion." },
    { "id": "2", "text": "Galaxies also influence large-scale cosmic movements." }
  ]
}

---

## Your Task:
- Analyze "unprocessedItems" to determine if they still belong to the given "group".
- If they fit, update the group's summary (if necessary).
- If a message shifts the topic significantly, create a **newGroup**.
- **Do NOT create more than one newGroup.**
- If no group exists, always create a newGroup.

### **Rules:**
1. If all unprocessed items belong to the existing group, update **only** the group summary.
2. If an item shifts the topic:
   - Keep the existing "group".
   - Create a **newGroup** with:
     - "n": A name for the new group.
     - "s": A summary of its topic.
     - "firstItemId": The ID of the first item in the new group.
3. **STRICT JSON FORMAT:** No extra properties, text, or explanations.

---

## Output Format:
**STRICTLY FOLLOW THIS OUTPUT FORMAT:**
{
  "group": { "n": "Updated Group Name", "s": "Updated Summary" },
  "newGroup": { "n": "New Group Name", "s": "New Group Summary", "firstItemId": "ID" }
}

## 🚨 DO NOT:
- Include explanations, text, or additional properties.
- Use "groupA", "groupB", "newGroups" or any other key names.
- Add "items", "text", or any new fields.
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
You are an API that receives JSON input and responds ONLY with JSON.  
⚠️ Your output **MUST** be valid JSON, as it will be parsed directly with JSON.parse().

---

## **Input Format:**
You will receive a list of topics, each with a name and a relevance score in parentheses.
At the end, after the list and an additional linebreak, you will also receive a list of new messages.
If there are no topics yet, you will receive "<no topics yet>".

Example input:
universe (90)
expansion (100)

messages:
The universe is constantly expanding, but scientists are still debating the exact rate.
Dark energy is thought to play a significant role in driving the expansion of the universe.
Recent measurements suggest there may be discrepancies in the Hubble constant values.
These discrepancies might point to unknown physics beyond our current models.
For instance, some theories suggest modifications to general relativity could explain this.


## Your Task:
1.	Analyze the messages and update the topic list accordingly:
  - If a message strengthens an existing topic, increase its relevance score (up to 100).
  - If a new important topic appears, add it (max 5 topics total).
  - If a new topic is similar to an existing one, keep the existing one.
  - If a topic becomes less relevant, decrease its relevance.
2.	Output Format:
	- Return ONLY a JSON array of topics with the format:

## Example output:
[
  { "n": "topic_name", "rel": 90 },
  { "n": "another_topic", "rel": 100 }
]

## 🚨 Caution:
- DO NOT: Include explanations, text, or additional properties.
- DO NOT: Return an object.
- DO NOT: Include comments, or any other text.
- DO NOT: Include the "messages" property in the output.

## ALWAYS:
- Return ONLY a JSON array of topic objects (with the properties "n" and "rel").
`;

export const synergyTopicsExamples = [
  {
    input: `
universe (90)
expansion (100)

messages:
The universe is constantly expanding, but scientists are still debating the exact rate.
Dark energy is thought to play a significant role in driving the expansion of the universe.
Recent measurements suggest there may be discrepancies in the Hubble constant values.
These discrepancies might point to unknown physics beyond our current models.
For instance, some theories suggest modifications to general relativity could explain this.`,
    output: `[
{ "n": "universe", "rel": 100 },
{ "n": "expansion", "rel": 100 },
{ "n": "darkenergy", "rel": 90 },
{ "n": "hubble", "rel": 80 },
{ "n": "relativity", "rel": 70 }
    ]`,
  },
  {
    input: `
fitness (80)
nutrition (70)

messages:
Hydration is a key factor in maintaining fitness performance.
Electrolytes in water support muscle function and recovery.
A balanced diet is essential for recovery and energy levels.
Strength training complements cardio for a well-rounded fitness routine.
Proper hydration prevents cramps and fatigue during workouts.`,
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
