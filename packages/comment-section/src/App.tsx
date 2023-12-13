import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import CommentSection from "./Components/CommentSection";

export default function App({
  perspective,
  source,
  agent,
}: {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
}) {
  if (!perspective?.uuid || !source) {
    return null;
  }

  return (
    <CommentSection agent={agent} perspective={perspective} source={source} />
  );
}
