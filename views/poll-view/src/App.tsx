import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@coasys/flux-types";
import "@coasys/flux-ui/dist/main.d.ts";
import styles from "./App.module.scss";
import PollView from "./components/PollView";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App(props: Props) {
  if (!props.perspective?.uuid || !props.agent) return "No perspective or agent client";
  return (
    <div className={styles.wrapper}>
      <PollView {...props} />
    </div>
  );
}
