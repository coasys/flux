import { ChannelView } from "@fluxapp/types";

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
    type: ChannelView.Post,
    component: "post-view",
  },
  {
    title: "Graph",
    description: "A graph view of the channel's data",
    icon: "share",
    type: ChannelView.Graph,
    component: "graph-view",
  },
  {
    title: "Voice",
    description: "Audio/Video channel",
    icon: "mic",
    type: ChannelView.Voice,
    component: "webrtc-view",
  },
  {
    title: "Debug",
    description: "WebRTC debugger",
    icon: "bug",
    type: ChannelView.Debug,
    component: "webrtc-debug-view",
  },
];

export const DEFAULT_TESTING_NEIGHBOURHOOD =
  "neighbourhood://QmzSYwdeuMKemKhLD5vN69iPN71vRrXtV23vdk3dPhK2xMzCTjq";
