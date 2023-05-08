import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { useWebRTC } from "utils/react-web";
import useKeyEvent from "../../hooks/useKeyEvent";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import { getMe, Me } from "utils/api";

import UserGrid from "../UserGrid";
import UiContext from "../../context/UiContext";
import JoinScreen from "../JoinScreen";
import Overlay from "../Overlay/Overlay";
import Debug from "../Debug";

import styles from "./Channel.module.css";

export default function Channel({ source, uuid }) {
  const [agent, setAgent] = useState<Me | null>(null);
  const wrapperEl = useRef<HTMLDivElement | null>(null);

  const wrapperObserver = useIntersectionObserver(wrapperEl, {});
  const isPageActive = !!wrapperObserver?.isIntersecting;

  const {
    state: { showSettings, showDebug },
    methods: { toggleShowSettings, toggleShowDebug },
  } = useContext(UiContext);

  const webRTC = useWebRTC({
    enabled: isPageActive,
    source,
    uuid,
  });

  useKeyEvent("KeyD", () => {
    toggleShowDebug(!showDebug);
  });

  // Get agent/me
  useEffect(() => {
    async function fetchAgent() {
      const agent = await getMe();
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
          currentUser={agent}
          onToggleSettings={() => toggleShowSettings(!showSettings)}
        />
      )}

      {webRTC.hasJoined && (
        <>
          <UserGrid webRTC={webRTC} currentUser={agent} />
        </>
      )}

      {showDebug && webRTC.hasJoined && (
        <>
          <Debug webRTC={webRTC} currentUser={agent} />
        </>
      )}

      <Overlay webRTC={webRTC} currentUser={agent} />
    </section>
  );
}
