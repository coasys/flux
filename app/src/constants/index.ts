import { ChannelView } from "@fluxapp/types";

export const viewOptions = [
  {
    title: "Chat",
    description: "Real time message with your community members",
    icon: "chat",
    type: ChannelView.Chat,
    pkg: "@fluxapp/chat-view",
    component: "chat-view",
  },
  {
    title: "Posts",
    description: "A feed of posts that users can publish",
    icon: "card-heading",
    type: ChannelView.Post,
    pkg: "@fluxapp/post-view",
    component: "post-view",
  },
  {
    title: "Graph",
    description: "A graph view of the channel's data",
    icon: "share",
    type: ChannelView.Graph,
    pkg: "@fluxapp/graph-view",
    component: "graph-view",
  },
  {
    title: "Voice",
    description: "Audio/Video channel",
    icon: "mic",
    type: ChannelView.Voice,
    pkg: "@fluxapp/webrtc-view",
    component: "webrtc-view",
  },
  {
    title: "Debug",
    description: "WebRTC debugger",
    icon: "bug",
    type: ChannelView.Debug,
    pkg: "@fluxapp/webrtc-debug-view",
    component: "webrtc-debug-view",
  },
];

export const DEFAULT_TESTING_NEIGHBOURHOOD =
  "neighbourhood://QmzSYwdpKpxM9PzEe5LEyd9vvcXb4MYmsY4A6dNsButwkoUTBfz";
