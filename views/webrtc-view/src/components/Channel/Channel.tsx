import { Agent, PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { useWebRTC } from "@coasys/flux-react-web";
import { Profile, SignallingService } from "@coasys/flux-types";
import { MutableRef, useContext, useEffect, useRef, useState } from "preact/hooks";
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
  appStore: any;
  currentView: string;
  webrtcConnections?: MutableRef<string[]>;
  signallingService: SignallingService;
  setModalOpen?: (state: boolean) => void;
  getProfile: (did: string) => Promise<Profile>;
};

export default function Channel({
  source,
  perspective,
  agent: agentClient,
  appStore,
  currentView,
  webrtcConnections,
  signallingService,
  setModalOpen,
  getProfile,
}: Props) {
  const [, forceUpdate] = useState({});
  const [agent, setAgent] = useState<Agent | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapperEl = useRef<HTMLDivElement | null>(null);

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

  async function fetchAgentData() {
    const me = await agentClient.me();
    setAgent(me);
    const myProfile = await getProfile(me.did);
    setProfile(myProfile);
  }

  async function joinRoom(e) {
    appStore.setActiveWebrtc(webRTC, source);
    appStore.activeWebrtc.instance.onJoin(e);

    setTimeout(() => {
      appStore.setInCall(true);
      signallingService.setInCall(true);
    }, 100);
  }

  function leaveRoom() {
    if (appStore.activeWebrtc.instance) appStore.activeWebrtc.instance.onLeave();
    appStore.setActiveWebrtc(undefined, "");

    appStore.setInCall(false);
    signallingService.setInCall(false);

    forceUpdate({});
  }

  // useEffect(() => {
  //   webrtcConnections.current = webRTC.connections.map((peer) => peer.did);
  // }, [webRTC.connections]);

  // useEffect(() => {
  //   const cleanupWebRTC = () => {
  //     try {
  //       // 1. Cleanup WebRTC instance
  //       if (appStore?.activeWebrtc?.instance) {
  //         appStore.activeWebrtc.instance.onLeave();
  //       }
  //       // 2. Update store directly
  //       const key = `app-${version}`;
  //       const stored = localStorage.getItem(key);
  //       if (stored) {
  //         const state = JSON.parse(stored);
  //         state.activeWebrtc = { instance: undefined, channelId: "" };
  //         localStorage.setItem(key, JSON.stringify(state));
  //       }
  //       // 3. Update Pinia store
  //       appStore.setActiveWebrtc(undefined, "");
  //     } catch (error) {
  //       console.error("WebRTC cleanup failed:", error);
  //     }
  //   };

  //   window.addEventListener("beforeunload", cleanupWebRTC, { capture: true });

  //   return () => {
  //     window.removeEventListener("beforeunload", cleanupWebRTC);
  //   };
  // }, [appStore]);

  // useEffect(() => {
  //   if (appStore && appStore.activeWebrtc) {
  //     const { channelId } = appStore.activeWebrtc;
  //     setInAnotherRoom(!!channelId && channelId !== source);
  //   }
  // }, [appStore, appStore?.activeWebrtc?.channelId]);

  useEffect(() => {
    if (!agent && getProfile) fetchAgentData();
  }, [agent, getProfile]);

  return (
    <section
      className={`${styles.outer} ${fullscreen && styles.fullscreen} ${currentView === "@coasys/flux-synergy-demo-view" && styles.synergy}`}
      ref={wrapperEl}
    >
      {!["@coasys/flux-webrtc-view", "@coasys/flux-synergy-demo-view"].includes(currentView) && setModalOpen && (
        <button className={styles.closeButton} onClick={() => setModalOpen(false)}>
          <j-icon name="x" color="color-white" />
        </button>
      )}

      {!webRTC.hasJoined && appStore && profile && (
        <JoinScreen
          webRTC={webRTC}
          profile={profile}
          did={agent?.did}
          onToggleSettings={() => toggleShowSettings(!showSettings)}
          currentView={currentView}
          fullscreen={fullscreen}
          setFullscreen={setFullscreen}
          joinRoom={joinRoom}
          leaveRoom={leaveRoom}
          appStore={appStore}
        />
      )}

      {webRTC.hasJoined && (
        <>
          <UserGrid webRTC={webRTC} profile={profile} getProfile={getProfile} />
          <Footer
            webRTC={webRTC}
            onToggleSettings={() => toggleShowSettings(!showSettings)}
            currentView={currentView}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
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
