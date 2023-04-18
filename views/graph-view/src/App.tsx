import CommunityGraph from "./components/CommunityGraph";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

export default function App({
  perspective,
  source,
}: {
  perspective: PerspectiveProxy;
  source: string;
}) {
  console.log("in graph view", { perspective, source });

  if (!perspective?.uuid || !source) {
    return null;
  }

  return <CommunityGraph source={source} uuid={perspective.uuid} />;
}
