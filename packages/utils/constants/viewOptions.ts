import { ChannelView } from "../types";

export default [
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
    description: "A graph view of your data",
    icon: "search",
    type: ChannelView.Graph,
    component: "graph-view",
  },
];
