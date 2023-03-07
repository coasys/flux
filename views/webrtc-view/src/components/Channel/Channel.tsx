import { useContext, useEffect, useRef, useState } from "preact/hooks";
import useWebRTC from "../../hooks/useWebrtc";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import getMe, { Me } from "utils/api/getMe";

import UserGrid from "../UserGrid";
import Footer from "../Footer";
import Notifications from "../Notifications";
import UiContext from "../../context/UiContext";
import Overlay from "../Overlay/Overlay";
import JoinScreen from "../JoinScreen";

import styles from "./Channel.module.css";

export default function Channel({ source, uuid }) {
  const [agent, setAgent] = useState<Me | null>(null);
  const wrapperEl = useRef<HTMLDivElement | null>(null);

  const wrapperObserver = useIntersectionObserver(wrapperEl, {});
  const isPageActive = !!wrapperObserver?.isIntersecting;

  const {
    state: { showSettings },
    methods: { addNotification, toggleShowSettings },
  } = useContext(UiContext);

  const webRTC = useWebRTC({
    enabled: isPageActive,
    source,
    uuid,
    events: {
      onPeerJoin: (userId) => addNotification({ userId, type: "join" }),
      onPeerLeave: (userId) => addNotification({ userId, type: "leave" }),
    },
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
          <Footer
            webRTC={webRTC}
            onToggleSettings={() => toggleShowSettings(!showSettings)}
          />
        </>
      )}

      <Overlay webRTC={webRTC} currentUser={agent} />

      <Notifications />
    </section>
  );
}
