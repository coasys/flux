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
    title: "Post",
    description: "A feed of posts that users can publish",
    icon: "card-heading",
    type: ChannelView.Forum,
    component: "forum-view",
  },
];
