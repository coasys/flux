import { ChannelView } from "@coasys/flux-types";

export const viewOptions = [
  {
    title: "Chat",
    description: "Real time message with your community members",
    icon: "chat",
    type: ChannelView.Chat,
    pkg: "@coasys/flux-chat-view",
    component: "chat-view",
  },
  {
    title: "Posts",
    description: "A feed of posts that users can publish",
    icon: "card-heading",
    type: ChannelView.Post,
    pkg: "@coasys/flux-post-view",
    component: "post-view",
  },
  {
    title: "Graph",
    description: "A graph view of the channel's data",
    icon: "share",
    type: ChannelView.Graph,
    pkg: "@coasys/flux-graph-view",
    component: "graph-view",
  },
  {
    title: "Voice",
    description: "Audio/Video channel",
    icon: "mic",
    type: ChannelView.Voice,
    pkg: "@coasys/flux-webrtc-view",
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
  "neighbourhood://QmzSYwdbV91f58JrpxK4EWN8Rk2W8J7npVrJceCFxVtU374AHn3";
