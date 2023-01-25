import { ChannelView } from "utils/types";

export const viewOptions = [
  {
    title: "Chat",
    description: "Real time message with your community members",
    icon: "chat",
    type: ChannelView.Chat,
    component: "chat-view",
  },
  {
    title: "Posts",
    description: "A feed of posts that users can publish",
    icon: "card-heading",
    type: ChannelView.Forum,
    component: "forum-view",
  },
  {
    title: "Graph",
    description: "A graph view of the channel's data",
    icon: "share",
    type: ChannelView.Graph,
    component: "graph-view",
  },
];

export const DEFAULT_TESTING_NEIGHBOURHOOD =
  "neighbourhood://QmbNH3q35YzNJBQBFRHwap68dyZ8LfzafqDKWLCdLvDnqU";
