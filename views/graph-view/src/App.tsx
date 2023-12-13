import CommunityGraph from "./components/CommunityGraph";
import { PerspectiveProxy } from "@coasys/ad4m";

export default function App({
  perspective,
  source,
}: {
  perspective: PerspectiveProxy;
  source: string;
}) {
  if (!perspective?.uuid || !source) {
    return null;
  }

  return <CommunityGraph source={source} perspective={perspective} />;
}
