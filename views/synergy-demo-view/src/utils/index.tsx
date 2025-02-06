import { Literal } from "@coasys/ad4m";

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
