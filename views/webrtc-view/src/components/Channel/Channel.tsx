import { useContext, useEffect, useRef, useState } from "preact/hooks";
import useWebRTC from "../../hooks/useWebrtc";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import getMe, { Me } from "utils/api/getMe";
import { Howl } from "howler";
import joinMp3 from "../../assets/pop.wav";
import leaveMp3 from "../../assets/leave.mp3";
import UserGrid from "../UserGrid";
import Footer from "../Footer";
import Notifications from "../Notifications";
import UiContext from "../../context/UiContext";
import Overlay from "../Overlay/Overlay";
import JoinScreen from "../JoinScreen";

import styles from "./Channel.module.css";
import Debug from "../Debug";

export default function Channel({ source, uuid }) {
  const [agent, setAgent] = useState<Me | null>(null);
  const wrapperEl = useRef<HTMLDivElement | null>(null);
  const [soundPlaying, setSoundPlaying] = useState(false);

  const wrapperObserver = useIntersectionObserver(wrapperEl, {});
  const isPageActive = !!wrapperObserver?.isIntersecting;

  const {
    state: { showSettings, showDebug },
    methods: { addNotification, toggleShowSettings },
  } = useContext(UiContext);

  const webRTC = useWebRTC({
    enabled: isPageActive,
    source,
    uuid,
    events: {
      onPeerJoin: (userId) => {
        addNotification({ userId, type: "join" });

        if (!soundPlaying) {
          const joinSound = new Howl({
            src: [joinMp3],
            volume: 0.5,
          });

          setSoundPlaying(true);
          joinSound.play();
          joinSound.on("end", function () {
            setSoundPlaying(false);
          });
        }
      },
      onPeerLeave: (userId) => {
        addNotification({ userId, type: "leave" });

        if (!soundPlaying) {
          const leaveSound = new Howl({
            src: [leaveMp3],
            volume: 0.5,
          });
          leaveSound.play();
          leaveSound.on("end", function () {
            setSoundPlaying(false);
          });
        }
      },
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

      <>{showDebug && <Debug webRTC={webRTC} currentUser={agent} />}</>

      <Notifications />
    </section>
  );
}
