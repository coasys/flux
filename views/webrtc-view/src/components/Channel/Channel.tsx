import { useEffect, useState } from "preact/hooks";
import useWebRTC from "../../hooks/useWebrtc";
import getMe, { Me } from "utils/api/getMe";

import UserGrid from "../UserGrid";
import Footer from "../Footer";

import styles from "./Channel.module.css";
import Debug from "../Debug";

export default function Channel({ source, uuid }) {
  const [showDebug, setShowDebug] = useState(false);
  const [agent, setAgent] = useState<Me | null>(null);

  const {
    connections,
    reactions,
    settings,
    hasJoined,
    localStream,
    onChangeSettings,
    onJoin,
    onLeave,
    onReaction,
  } = useWebRTC({
    source,
    uuid,
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
              <j-toggle
                checked={settings.video}
                onChange={() =>
                  onChangeSettings({ ...settings, video: !settings.video })
                }
              >
                Join with camera
              </j-toggle>
            </j-box>

            <j-box pt="500">
              <j-button variant="primary" size="lg" onClick={onJoin}>
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

      <>{showDebug && <Debug connections={connections} />}</>

      <Footer
        settings={settings}
        hasJoined={hasJoined}
        onChangeSettings={onChangeSettings}
        onToggleDebug={() => setShowDebug(!showDebug)}
        onReaction={onReaction}
        onLeave={onLeave}
      />
    </section>
  );
}
