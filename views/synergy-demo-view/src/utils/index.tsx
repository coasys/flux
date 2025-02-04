import { Conversation, ConversationSubgroup } from "@coasys/flux-api";
import { getSynergyItems, findUnprocessedItems, findAllChannelSubgroupIds } from "@coasys/flux-utils";
import { Literal } from "@coasys/ad4m";

export type GroupData = {
  matchIndexes?: number;
  groupType: "conversation" | "subgroup" | "item";
  totalChildren: number;
  participants: string[];
  topics: any[];
};

type ConversationData = Conversation & GroupData;

type SubgroupData = ConversationSubgroup & GroupData & { start: string; end: string };

// constants
export const groupingOptions = ["Conversations", "Subgroups", "Items"];
export const itemTypeOptions = ["All Types", "Messages", "Posts", "Tasks"];

// helper functions
export function closeMenu(menuId: string) {
  const menu = document.getElementById(menuId);
  const items = menu?.shadowRoot?.querySelector("details");
  if (items) items.open = false;
}

export async function getConversations(perspective, channelId) {
  const result = await perspective.infer(`
    findall(ConversationInfo, (
      % 1. Identify all conversations in the channel
      subject_class("Conversation", CC),
      instance(CC, Conversation),
      
      % 2. Get timestamp from link
      link("${channelId}", "ad4m://has_child", Conversation, Timestamp, _),

      % 3. Retrieve conversation properties
      property_getter(CC, Conversation, "conversationName", ConversationName),
      property_getter(CC, Conversation, "summary", Summary),

      % 4. Build a single structure for each conversation
      ConversationInfo = [Conversation, ConversationName, Summary, Timestamp]
    ), Conversations).
  `);

  // Convert raw Prolog output into a simpler JS array
  const conversations = (result[0]?.Conversations || []).map(
    ([baseExpression, conversationName, summary, timestamp]) => ({
      baseExpression,
      name: Literal.fromUrl(conversationName).get().data,
      summary: Literal.fromUrl(summary).get().data,
      timestamp: parseInt(timestamp, 10),
    })
  );

  return conversations;
}

export async function getConversationData(perspective, channelId, match?, setMatchIndexes?) {
  // gather up unprocessed items
  const channelItems = await getSynergyItems(perspective, channelId);
  const conversations = (await Conversation.query(perspective, {
    source: channelId,
  })) as ConversationData[];
  const allSubgroupIds = await findAllChannelSubgroupIds(perspective, conversations);
  const unprocessedItems = await findUnprocessedItems(perspective, channelItems, allSubgroupIds);
  const conversationsWithData = await Promise.all(
    conversations.map(async (conversation, conversationIndex) => {
      if (match && conversation.baseExpression === match.baseExpression) setMatchIndexes(conversationIndex);
      const conversationParticipants = new Set<string>();
      const uniqueTopicsByName = new Map();
      const subgroups = (await conversation.subgroups()) as SubgroupData[];
      const subgroupsWithData = await Promise.all(
        subgroups.map(async (subgroup, subgroupIndex) => {
          if (match && subgroup.baseExpression === match.baseExpression) {
            setMatchIndexes(conversationIndex);
            conversation.matchIndexes = subgroupIndex;
          }
          subgroup.groupType = "subgroup";
          subgroup.topics = await subgroup.topicsWithRelevance();
          subgroup.topics.forEach((topic) => uniqueTopicsByName.set(topic.name, topic));
          const subgroupItems = await getSynergyItems(perspective, subgroup.baseExpression);
          if (subgroupItems.length) {
            subgroup.start = subgroupItems[0].timestamp;
            subgroup.end = subgroupItems[subgroupItems.length - 1].timestamp;
          }
          const subgroupParticipants = new Set<string>();
          subgroup.children = subgroupItems.map((item: any, itemIndex) => {
            item.groupType = "item";
            if (match && item.baseExpression === match.baseExpression) {
              setMatchIndexes(conversationIndex);
              conversation.matchIndexes = subgroupIndex;
              subgroup.matchIndexes = itemIndex;
            }
            subgroupParticipants.add(item.author);
            conversationParticipants.add(item.author);
            return item;
          });
          subgroup.participants = [...subgroupParticipants];
          return subgroup;
        })
      );
      conversation.groupType = "conversation";
      conversation.participants = [...conversationParticipants];
      conversation.topics = [...uniqueTopicsByName.values()];
      conversation.children = subgroupsWithData;
      return conversation;
    })
  );
  return {
    conversations: conversationsWithData,
    unprocessedItems,
  };
}

// svgs
export function ChevronUpSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        fill="currentColor"
        d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"
      />
    </svg>
  );
}

export function ChevronDownSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        fill="currentColor"
        d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
      />
    </svg>
  );
}

export function ChevronRightSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
      <path
        fill="currentColor"
        d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
      />
    </svg>
  );
}

export function CurveSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="60" version="1.1" viewBox="0 0 10.054 15.875">
      <g transform="translate(-3.39 -5.533)">
        <path
          fill="none"
          stroke="currentColor"
          strokeDasharray="none"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
          strokeOpacity="1"
          strokeWidth="1.587"
          d="M4.185 5.533c0 10.349 8.466 4.714 8.466 15.876"
        />
      </g>
    </svg>
  );
}
