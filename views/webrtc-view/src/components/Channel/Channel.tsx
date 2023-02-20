import { useContext, useEffect, useState } from "preact/hooks";
import useWebRTC from "../../hooks/useWebrtc";
import getMe, { Me } from "utils/api/getMe";

import UserGrid from "../UserGrid";
import Footer from "../Footer";
import Debug from "../Debug";

import styles from "./Channel.module.css";
import Notifications from "../Notifications";
import UiContext from "../../context/UiContext";
import Disclaimer from "../Disclaimer";

export default function Channel({ source, uuid }) {
  const [showDebug, setShowDebug] = useState(false);
  const [agent, setAgent] = useState<Me | null>(null);

  const {
    methods: { addNotification },
  } = useContext(UiContext);

  const {
    connections,
    reactions,
    settings,
    hasJoined,
    isLoading,
    localStream,
    onChangeSettings,
    onJoin,
    onLeave,
    onReaction,
    onSendTestSignal,
    onSendTestBroadcast,
  } = useWebRTC({
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
    <section className={styles.outer}>
      {!hasJoined && (
        <div className={styles.join}>
          <j-flex a="center" direction="column">
            <h1>You haven't joined this room</h1>

            <j-text variant="body">Your microphone will be enabled.</j-text>

            <j-box pt="200">
              <Disclaimer />
            </j-box>

            <j-box pt="400">
              <j-toggle
                checked={settings.video}
                disabled={isLoading}
                onChange={() =>
                  onChangeSettings({ ...settings, video: !settings.video })
                }
              >
                Join with camera
              </j-toggle>
            </j-box>

            <j-box pt="500">
              <j-button
                variant="primary"
                size="lg"
                loading={isLoading}
                onClick={onJoin}
              >
                Join room!
              </j-button>
            </j-box>
          </j-flex>
        </div>
      )}

      <UserGrid
        currentUser={agent}
        settings={settings}
        localStream={localStream}
        peers={connections}
        reactions={reactions}
      />

      <>
        {showDebug && (
          <Debug
            connections={connections}
            onSendTestSignal={onSendTestSignal}
            onSendTestBroadcast={onSendTestBroadcast}
          />
        )}
      </>

      <Footer
        settings={settings}
        hasJoined={hasJoined}
        onChangeSettings={onChangeSettings}
        onToggleDebug={() => setShowDebug(!showDebug)}
        onReaction={onReaction}
        onLeave={onLeave}
      />

      <Notifications />
    </section>
  );
}
