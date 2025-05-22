import { Agent, PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { useWebRTC, WebRTC } from "@coasys/flux-react-web";
import { Profile } from "@coasys/flux-types";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import UiContext from "../../context/UiContext";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import Debug from "../Debug";
import Footer from "../Footer";
import JoinScreen from "../JoinScreen";
import Notifications from "../Notifications";
import Overlay from "../Overlay/Overlay";
import Transcriber from "../Transcriber";
import UserGrid from "../UserGrid";
import styles from "./Channel.module.scss";

type Props = {
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
  webrtcStore: any;
  uiStore: any;
  getProfile: (did: string) => Promise<Profile>;
};

export default function Channel({ source, perspective, agent: agentClient, webrtcStore, uiStore, getProfile }: Props) {
  const [, forceUpdate] = useState({});
  const [agent, setAgent] = useState<Agent | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapperEl = useRef<HTMLDivElement | null>(null);
  const wrapperObserver = useIntersectionObserver(wrapperEl, {});
  const isPageActive = !!wrapperObserver?.isIntersecting;
  const webRTCService = useRef<WebRTC | null>(null);
  // const [webRTC, setWebRTC] = useState<WebRTC | null>(null);

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

  async function fetchAgentData() {
    const me = await agentClient.me();
    setAgent(me);
    const myProfile = await getProfile(me.did);
    setProfile(myProfile);
  }

  function leaveRoom() {
    webrtcStore.leaveRoom();
    setTimeout(() => forceUpdate({}), 100);
  }

  useEffect(() => {
    if (webrtcStore) webrtcStore.addInstance(webRTC);
  }, [webrtcStore]);

  useEffect(() => {
    if (!agent && getProfile) fetchAgentData();
  }, [agent, getProfile]);

  return (
    <section className={styles.wrapper} ref={wrapperEl}>
      {!webRTC.hasJoined && profile && (
        <JoinScreen
          webRTC={webRTC}
          profile={profile}
          did={agent?.did}
          onToggleSettings={() => toggleShowSettings(!showSettings)}
          fullscreen={fullscreen}
          setFullscreen={setFullscreen}
          webrtcStore={webrtcStore}
          leaveRoom={leaveRoom}
        />
      )}

      {webRTC.hasJoined && (
        <>
          <UserGrid webRTC={webRTC} profile={profile} getProfile={getProfile} />
          <Footer
            webRTC={webRTC}
            onToggleSettings={() => toggleShowSettings(!showSettings)}
            uiStore={uiStore}
            webrtcStore={webrtcStore}
            leaveRoom={leaveRoom}
          />
          {webRTC.localState.settings.transcriber.on && (
            <Transcriber webRTC={webRTC} source={source} perspective={perspective} />
          )}
        </>
      )}

      <Overlay webRTC={webRTC} profile={profile} />

      {showDebug && <Debug webRTC={webRTC} profile={profile} />}

      <Notifications />
    </section>
  );
}
