import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@coasys/flux-types";
import { MutableRef } from "preact/hooks";
import Channel from "./components/Channel";
import { UiProvider } from "./context/UiContext";

type Props = {
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
  appStore: any;
  currentView: string;
  webrtcConnections?: MutableRef<string[]>;
  setModalOpen?: (state: boolean) => void;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App(props: Props) {
  if (!props.perspective?.uuid || !props.source) {
    return null;
  }

  return (
    <UiProvider>
      <Channel {...props} />
    </UiProvider>
  );
}
