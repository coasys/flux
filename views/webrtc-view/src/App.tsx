import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@coasys/flux-types";
import Channel from "./components/Channel";
import { UiProvider } from "./context/UiContext";

type Props = {
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
  webrtcStore: any;
  uiStore: any;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App(props: Props) {
  if (!props.perspective?.uuid || !props.source) return null;

  return <UiProvider>{props.agent && <Channel {...props} />}</UiProvider>;
}
