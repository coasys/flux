import { Conversation, ConversationSubgroup, SubjectRepository } from "@coasys/flux-api";
import { findRelationships, findTopics, getSubgroupItems } from "@coasys/flux-utils";

// constants
export const groupingOptions = ["Conversations", "Subgroups", "Items"];
export const itemTypeOptions = ["All Types", "Messages", "Posts", "Tasks"];

// helper functions
export async function getConvoData(perspective, channelId, match?, setMatchIndex?) {
  const conversationRepo = await new SubjectRepository(Conversation, {
    perspective,
    source: channelId,
  });
  const conversations = (await conversationRepo.getAllData()) as any;
  return await Promise.all(
    conversations.map(async (conversation, conversationIndex) => {
      if (match && conversation.id === match.id) setMatchIndex(conversationIndex);
      const subgroupRepo = await new SubjectRepository(ConversationSubgroup, {
        perspective,
        source: conversation.id,
      });
      const subgroups = (await subgroupRepo.getAllData()) as any;
      const subgroupsWithData = await Promise.all(
        subgroups.map(async (subgroup, subgroupIndex) => {
          if (match && subgroup.id === match.id) {
            setMatchIndex(conversationIndex);
            conversation.matchIndex = subgroupIndex;
          }
          const subgroupRelationships = await findRelationships(perspective, subgroup.id);
          const subgroupItems = await getSubgroupItems(perspective, subgroup.id);
          subgroup.groupType = "subgroup";
          if (match && subgroup.id === match.id) conversation.matchIndex = conversationIndex;
          subgroup.topics = await findTopics(perspective, subgroupRelationships);
          subgroup.start = subgroupItems[0].timestamp;
          subgroup.end = subgroupItems[subgroupItems.length - 1].timestamp;
          subgroup.participants = ["did:key:z6Mkjq3AT56DQ5g1D9BrmoeHfidv5xU5ibya5EF5rjWwaquL"];
          subgroup.children = await Promise.all(
            subgroupItems.map(async (item: any, itemIndex) => {
              const itemRelationships = await findRelationships(perspective, item.id);
              item.groupType = "item";
              if (match && item.id === match.id) {
                setMatchIndex(conversationIndex);
                conversation.matchIndex = subgroupIndex;
                subgroup.matchIndex = itemIndex;
              }
              item.topics = await findTopics(perspective, itemRelationships);
              if (!subgroup.participants.find((p) => p === item.author))
                subgroup.participants.push(item.author);
              return item;
            })
          );
          return subgroup;
        })
      );
      conversation.groupType = "conversation";
      conversation.participants = ["did:key:z6Mkjq3AT56DQ5g1D9BrmoeHfidv5xU5ibya5EF5rjWwaquL"];
      subgroupsWithData.forEach((subgroup) => {
        subgroup.participants.forEach((p) => {
          if (!conversation.participants.includes(p)) conversation.participants.push(p);
        });
      });
      const conversationRelationships = await findRelationships(perspective, conversation.id);
      conversation.topics = await findTopics(perspective, conversationRelationships);
      conversation.children = subgroupsWithData;
      return conversation;
    })
  );
}

// svgs
export function ChevronUpSVG() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="chevron-up"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <path
        fill="currentColor"
        d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z"
      />
    </svg>
  );
}

export function ChevronDownSVG() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="chevron-down"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <path
        fill="currentColor"
        d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
      />
    </svg>
  );
}

export function CurveSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="38"
      height="60"
      version="1.1"
      viewBox="0 0 10.054 15.875"
    >
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
