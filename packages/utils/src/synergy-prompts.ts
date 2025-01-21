export const synergyGroupingPrompt = `
You are here as an integrated part of a chat system - you're answers will be directly parsed by JSON.parse().
So make sure to always (!) respond with valid JSON!!

I'm passing you a JSON object with the following properties:
1. 'existingTopics' (String array of all existing topic names)
2. 'previousSubgroups' (Object array of all previous subgroup summaries and names)
3. 'currentSubgroup' (Object with name, summary and topics of the currently active subgroup)
3. 'unprocessedItems' (Object array of all unprocessed items. Each unprocessed item is a javascript object with an 'id' property (string) and a 'text' property (string))

Main point of this is sorting the new messages into the flow of the conversation, either all in the current subgroup,
or if necessary creating a new subgroup.

I want you to respond with a JSON object with these properties:
1. 'conversationData' (Object with 'name' and 'summary' properties. Updated summary of the whole conversation taking all subgroup titles and summaries (old and new) into account).
2. 'currentSubgroup' (Undefined or Object with 'name', 'summary' and 'topics' of the current subgroup after including new items)
3. 'newSubgroup' (Undefined or an object with 'name', 'summary', 'topics' and 'firstItemId' of the new subgroupd spawned by a shift of the conversation in the new itmes)

Firstly, analyze the 'summary' of the 'currentSubgroup' and the 'text' property of each unprocessedItem to identify if the conversation has shifted to a new subject or not.
Consider the conversation as **related** if:
- The text in an unprocessed item discusses, contrasts, or expands upon themes present in the last unprocessed item.
- The text in an unprocessed item introduces new angles, comparisons, or opinions on the same topics discussed in the last unprocessed item (even if specific terms or phrases differ).
Only consider the conversation as having **shifted to a new subject** if:
- The text in an unprocessed item introduces entirely new topics, concepts, or themes that are not directly related to any topics discussed or implied in the last unprocessed item.
- The text in an unprocessed item does not logically connect or refer back to the themes in the last unprocessed item.
- The following messages actually reflect the acceptence of that topic shift.

If 'previousSubgroups' is emtpy, always create a 'newSubgroup' (the conversation has just begun).

In case where the conversation has shifted, also generate a 'newSubgroup' including the following properties:
1. 'name': a 1 to 3 word title (string) describing the contents of the subgroup.
2. 'summary': a 1 to 3 sentence paragraph (string) summary of the contents of the subgroup.
3. 'firstItemId': the 'id' of the first unprocessed item in the subgroup.
4. 'topics': an array of between 1 and 5 topic objects indicating topics that are relevant to the contents of the subgroup (a bit like hashtags).
Each topic object should including a 'name' property (a single word string in lowercase) for the name of the topic
and a 'relevance' property (number) between 0 and 100 (0 being irrelevant and 100 being highly relevant) that indicates how relevant the topic is to the content of the text.
If any of the topics you choose are similar to topics listed in the 'existingTopics' array, use the existing topic instead of creating 
a new one (i.e. if one of the new topics you picked was 'foods' and you find an existing topic 'food', use 'food' instead of creating a new topic that is just a plural version of the existing topic).
The output of this analysis will be a new 'subgroups' array conatining all of new subgroup objects you have generated.

Finally, analyse all the summaries in the original 'previousSubgroups' array and the new summaries you've created, and use this info to generate a new 'conversationData' object with the following properties:
1. 'name': a 1 to 3 word title (string) describing the contents of the conversation.
2. 'summary': a 1 to 3 sentence paragraph (string) summary of the contents of the conversation.

Make sure your response is in a format that can be parsed using JSON.parse(). Don't wrap it in code syntax. Don't append text outside of quotes. And don't use the assign operator ("=").
If you make a mistake and I can't parse your output, I will give you the same input again, plus another field "jsonParseError" holding the error we got from JSON.parse().
So if you see that field, take extra care about that specific mistake and don't make it again!
Don't talk about the errors in the summaries or topics.
`;

export const synergyGroupingExamples = [{
  input: `{
    "existingTopics": [],
    "previousSubgroups": [],
    "currentSubgroup": null,
    "unprocessedItems": [
      { "id": "1", "text": "The universe is constantly expanding, but scientists are still debating the exact rate." },
      { "id": "2", "text": "Dark energy is thought to play a significant role in driving the expansion of the universe." },
      { "id": "3", "text": "Recent measurements suggest there may be discrepancies in the Hubble constant values." },
      { "id": "4", "text": "These discrepancies might point to unknown physics beyond our current models." },
      { "id": "5", "text": "For instance, some theories suggest modifications to general relativity could explain this." }
    ]
  }`,
  output: `{
    "conversationData": {
      "name": "Cosmic Expansion",
      "summary": "The conversation explores the expansion of the universe, the role of dark energy, discrepancies in the Hubble constant, and potential modifications to general relativity."
    },
    "currentSubgroup": null,
    "newSubgroup": {
      "name": "Cosmic Expansion",
      "summary": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and possible new physics such as modifications to general relativity.",
      "firstItemId": "1",
      "topics": [
        { "name": "universe", "relevance": 100 },
        { "name": "expansion", "relevance": 100 },
        { "name": "darkenergy", "relevance": 90 },
        { "name": "hubble", "relevance": 80 },
        { "name": "relativity", "relevance": 70 }
      ]
    }
  }`,
},
{
  input: `{
    "existingTopics": ["universe", "expansion", "darkenergy", "hubble", "relativity"],
    "previousSubgroups": [
      {
        "name": "Cosmic Expansion",
        "summary": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and possible new physics such as modifications to general relativity."
      }
    ],
    "currentSubgroup": {
      "name": "Cosmic Expansion",
      "summary": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and possible new physics such as modifications to general relativity.",
      "topics": ["universe", "expansion", "darkenergy", "hubble", "relativity"]
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
    "conversationData": {
      "name": "Universe and Cooking",
      "summary": "The conversation explores the universe's expansion, including precise measurements of the Hubble constant, and transitions into tips for roasting vegetables to enhance their flavor."
    },
    "currentSubgroup": {
      "name": "Cosmic Expansion",
      "summary": "Discussion about the universe's expansion, including the role of dark energy, Hubble constant discrepancies, and precise measurements like those from the cosmic microwave background.",
      "topics": [
        { "name": "universe", "relevance": 100 },
        { "name": "expansion", "relevance": 100 },
        { "name": "darkenergy", "relevance": 90 },
        { "name": "hubble", "relevance": 80 },
        { "name": "relativity", "relevance": 70 }
      ]
    },
    "newSubgroup": {
      "name": "Vegetable Roasting",
      "summary": "Tips for enhancing vegetable flavors by roasting them with olive oil, garlic, herbs, and seasoning to achieve caramelization and depth.",
      "firstItemId": "8",
      "topics": [
        { "name": "cooking", "relevance": 100 },
        { "name": "vegetables", "relevance": 100 },
        { "name": "roasting", "relevance": 90 },
      ]
    }
  }`,
},
{
  input: `{
    "existingTopics": ["technology", "privacy", "data", "ethics"],
    "previousSubgroups": [
      {
        "name": "Tech and Privacy",
        "summary": "Discussion about how emerging technologies impact user privacy and the ethical implications of data collection."
      }
    ],
    "currentSubgroup": {
      "name": "Tech and Privacy",
      "summary": "Discussion about how emerging technologies impact user privacy and the ethical implications of data collection.",
      "topics": ["technology", "privacy", "data", "ethics"]
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
    "conversationData": {
      "name": "Tech and Collaboration",
      "summary": "The conversation discusses privacy-first approaches and challenges in technology, then transitions into effective team collaboration and tools that enhance productivity."
    },
    "currentSubgroup": {
      "name": "Tech and Privacy",
      "summary": "Discussion about how emerging technologies impact user privacy and the ethical implications of data collection, including privacy-first approaches and challenges for developers.",
      "topics": [
        { "name": "technology", "relevance": 100 },
        { "name": "privacy", "relevance": 100 },
        { "name": "data", "relevance": 80 }
      ]
    },
    "newSubgroup": {
      "name": "Team Collaboration",
      "summary": "Exploration of effective team collaboration, focusing on tools like Slack and Trello, and practices like regular check-ins to enhance productivity.",
      "firstItemId": "8",
      "topics": [
        { "name": "collaboration", "relevance": 100 },
        { "name": "productivity", "relevance": 90 },
        { "name": "tools", "relevance": 80 }
      ]
    }
  }`,
},
{
  input: `{
    "existingTopics": ["fitness", "health", "nutrition"],
    "previousSubgroups": [
      {
        "name": "Fitness and Nutrition",
        "summary": "Discussion about the importance of balanced nutrition in supporting fitness and overall health."
      }
    ],
    "currentSubgroup": {
      "name": "Fitness and Nutrition",
      "summary": "Discussion about the importance of balanced nutrition in supporting fitness and overall health.",
      "topics": ["fitness", "health", "nutrition"]
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
    "conversationData": {
      "name": "Fitness and Nutrition",
      "summary": "The conversation emphasizes the importance of balanced nutrition and hydration in supporting fitness, with a focus on how mineral content in water and electrolyte replenishment enhance recovery and performance."
    },
    "currentSubgroup": {
      "name": "Fitness and Nutrition",
      "summary": "Discussion about the importance of balanced nutrition, hydration, and how the mineral content in water contributes to fitness recovery and performance.",
      "topics": [
        { "name": "fitness", "relevance": 100 },
        { "name": "health", "relevance": 90 },
        { "name": "nutrition", "relevance": 100 },
        { "name": "hydration", "relevance": 80 }
      ]
    },
    "newSubgroup": null
  }`,
},
];