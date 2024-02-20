import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { getMe, Me } from "@coasys/flux-api";
import { useWebRTC } from "@coasys/flux-react-web";
import { useAgent } from "@coasys/ad4m-react-hooks";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";

import UserGrid from "../UserGrid";
import Footer from "../Footer";
import Notifications from "../Notifications";
import UiContext from "../../context/UiContext";
import Overlay from "../Overlay/Overlay";
import JoinScreen from "../JoinScreen";

import { PerspectiveProxy, Agent } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

// @ts-ignore
import styles from "./Channel.module.css";
import Debug from "../Debug";
import { profileFormatter } from "@coasys/flux-utils";
import { Profile } from "@coasys/flux-types";

type Props = {
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
};

export default function Channel({
  source,
  perspective,
  agent: agentClient,
}: Props) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const wrapperEl = useRef<HTMLDivElement | null>(null);

  const { profile } = useAgent<Profile>({ client: agentClient, did: () => agent?.did, formatter: profileFormatter });

  const wrapperObserver = useIntersectionObserver(wrapperEl, {});
  const isPageActive = !!wrapperObserver?.isIntersecting;

  const {
    state: { showSettings, showDebug },
    methods: { addNotification, toggleShowSettings },
  } = useContext(UiContext);

  const webRTC = useWebRTC({
    enabled: isPageActive,
    source,
    agent: agentClient,
    perspective,
    events: {
      onPeerJoin: (userId) => {
        // TODO: Fix this
        // addNotification({ id: userId, userId, type: "join" });
      },
      onPeerLeave: (userId) => {
        // TODO: Fix this
        // addNotification({ id: userId, userId, type: "leave" });
      },
    },
  });

  // Get agent/me
  useEffect(() => {
    async function fetchAgent() {
      const agent = await agentClient.me();
      setAgent(agent);
    }

    if (!agent) {
      fetchAgent();
    }
  }, [agent]);

  return (
    <section className={styles.outer} ref={wrapperEl}>
      {!webRTC.hasJoined && (
        <JoinScreen
          webRTC={webRTC}
          profile={profile}
          onToggleSettings={() => toggleShowSettings(!showSettings)}
        />
      )}

      {webRTC.hasJoined && (
        <>
          <UserGrid
            webRTC={webRTC}
            agentClient={agentClient}
            profile={profile}
          />
          <Footer
            webRTC={webRTC}
            onToggleSettings={() => toggleShowSettings(!showSettings)}
          />
        </>
      )}

      <Overlay webRTC={webRTC} profile={profile} />

      <>{showDebug && <Debug webRTC={webRTC} profile={profile} />}</>

      <Notifications />
    </section>
  );
}
