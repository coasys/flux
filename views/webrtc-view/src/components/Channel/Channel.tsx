import { useAgent } from "@coasys/ad4m-react-hooks";
import { useWebRTC } from "@coasys/flux-react-web";
import { MutableRef, useContext, useEffect, useRef, useState } from "preact/hooks";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import UiContext from "../../context/UiContext";
import Footer from "../Footer";
import JoinScreen from "../JoinScreen";
import Notifications from "../Notifications";
import Overlay from "../Overlay/Overlay";
import UserGrid from "../UserGrid";
import { Agent, PerspectiveProxy, PerspectiveExpression } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
// @ts-ignore
import { Profile } from "@coasys/flux-types";
import { profileFormatter } from "@coasys/flux-utils";
import Debug from "../Debug";
import Transcriber from "../Transcriber";
import styles from "./Channel.module.scss";
import { version } from "../../../../../app/package.json";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";

type Props = {
  source: string;
  perspective: PerspectiveProxy;
  agent: AgentClient;
  appStore: any;
  currentView: string;
  webrtcConnections?: MutableRef<string[]>;
  setModalOpen?: (state: boolean) => void;
};

export default function Channel({
  source,
  perspective,
  agent: agentClient,
  appStore,
  currentView,
  webrtcConnections,
  setModalOpen,
}: Props) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [inAnotherRoom, setInAnotherRoom] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapperEl = useRef<HTMLDivElement | null>(null);
  const testIndex = useRef(1);
  const [testResponses, setTestResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { profile } = useAgent<Profile>({
    client: agentClient,
    did: () => agent?.did,
    formatter: (profile: any) => {
      return profileFormatter(profile?.perspective?.links || profile);
    },
  });
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

  async function joinRoom(e) {
    appStore.setActiveWebrtc(webRTC, source);
    appStore.activeWebrtc.instance.onJoin(e);
  }

  function leaveRoom() {
    if (appStore.activeWebrtc.instance) appStore.activeWebrtc.instance.onLeave();
    appStore.setActiveWebrtc(undefined, '');
    setInAnotherRoom(false);
  }

  async function addSignalHandler() {
    const neighbourhood = await perspective.getNeighbourhoodProxy();
    const client = await getAd4mClient();
    const me = await client.agent.me();

    neighbourhood.addSignalHandler(async (expression: PerspectiveExpression) => {
      const link = expression.data.links[0];
      const { author, data } = link;
      const { predicate } = data;
      if (predicate === "test-signal" && author !== me.did) {
        console.log('***** Received test signal', data.target);
        await neighbourhood.sendBroadcastU({ links: [{ source: "", predicate: "test-signal-response", target: `${data.target}` }] });
      }

      if (predicate === "test-signal-response" && author !== me.did) {
        console.log('***** Received test signal response', data.target);
        setTestResponses((prev) => [...prev, `Test ${data.target} success!`]);
      }
    })
  }

  async function sendTestSignal() {
    setLoading(true);
    const neighbourhood = await perspective.getNeighbourhoodProxy();
    console.log('***** Sending test signal', testIndex.current);
    await neighbourhood.sendBroadcastU({ links: [{ source: "", predicate: "test-signal", target: `${testIndex.current}` }] });
    testIndex.current++;
    setLoading(false);
  }

  useEffect(() => {
    addSignalHandler()
  }, []);

  useEffect(() => {
    console.log('webRTC.connections updated', webRTC.connections);
    webrtcConnections.current = webRTC.connections.map((peer) => peer.did);
  }, [webRTC.connections]);

  useEffect(() => {
    const cleanupWebRTC = () => {
      try {
        // 1. Cleanup WebRTC instance
        if (appStore?.activeWebrtc?.instance) {
          appStore.activeWebrtc.instance.onLeave();
        }
        // 2. Update store directly
        const key = `app-${version}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const state = JSON.parse(stored);
          state.activeWebrtc = { instance: undefined, channelId: '' };
          localStorage.setItem(key, JSON.stringify(state));
        }
        // 3. Update Pinia store
        appStore.setActiveWebrtc(undefined, '');
      } catch (error) {
        console.error('WebRTC cleanup failed:', error);
      }
    };
  
    window.addEventListener('beforeunload', cleanupWebRTC, { capture: true });
  
    return () => {
      window.removeEventListener('beforeunload', cleanupWebRTC);
    };
  }, [appStore]);

  useEffect(() => {
    if (appStore && appStore.activeWebrtc) {
      const { channelId } = appStore.activeWebrtc;
      setInAnotherRoom(!!channelId && channelId !== source);
    }
  }, [appStore, appStore?.activeWebrtc?.channelId]);

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
    <section
      className={`${styles.outer} ${fullscreen && styles.fullscreen} ${currentView === "@coasys/flux-synergy-demo-view" && styles.synergy}`}
      ref={wrapperEl}
    >
      <j-box>
        <j-button onClick={sendTestSignal} disabled={loading} loading={loading}>Broadcast test signal</j-button>
        {testResponses.map((response, index) => (
          <j-text key={index} nomargin>
            {response}
          </j-text>
        ))}
      </j-box>

      {!["@coasys/flux-webrtc-view", "@coasys/flux-synergy-demo-view"].includes(currentView) &&
        setModalOpen && (
          <button className={styles.closeButton} onClick={() => setModalOpen(false)}>
            <j-icon name="x" color="color-white" />
          </button>
        )}
      {!webRTC.hasJoined && appStore && (
        <JoinScreen
          webRTC={webRTC}
          profile={profile}
          did={agent?.did}
          onToggleSettings={() => toggleShowSettings(!showSettings)}
          currentView={currentView}
          inAnotherRoom={inAnotherRoom}
          fullscreen={fullscreen}
          setFullscreen={setFullscreen}
          joinRoom={joinRoom}
          leaveRoom={leaveRoom}
        />
      )}

      {webRTC.hasJoined && (
        <>
          <UserGrid webRTC={webRTC} agentClient={agentClient} profile={profile} />
          <Footer webRTC={webRTC} onToggleSettings={() => toggleShowSettings(!showSettings)} currentView={currentView} fullscreen={fullscreen} setFullscreen={setFullscreen} />
          {webRTC.localState.settings.transcriber.on && (
            <Transcriber webRTC={webRTC} source={source} perspective={perspective} />
          )}
        </>
      )}

      <Overlay webRTC={webRTC} profile={profile} />

      <>{showDebug && <Debug webRTC={webRTC} profile={profile} />}</>

      <Notifications />
    </section>
  );
}
