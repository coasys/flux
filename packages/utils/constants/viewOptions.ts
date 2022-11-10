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
    description: "A chat",
    icon: "postcard",
    type: ChannelView.Forum,
    component: "chat-view",
  },
];
