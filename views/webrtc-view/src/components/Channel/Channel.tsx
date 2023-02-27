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
import Overlay from "../Overlay/Overlay";

export default function Channel({ source, uuid }) {
  const [agent, setAgent] = useState<Me | null>(null);

  const {
    state: { showSettings },
    methods: { addNotification, toggleShowSettings },
  } = useContext(UiContext);

  const webRTC = useWebRTC({
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
      {!webRTC.hasJoined && (
        <div className={styles.join}>
          <j-flex a="center" direction="column">
            <h1>You haven't joined this room</h1>

            <j-text variant="body">Your microphone will be enabled.</j-text>

            <j-box pt="200">
              <Disclaimer />
            </j-box>

            <j-box pt="400">
              <j-toggle
                checked={webRTC.settings.video}
                disabled={webRTC.isLoading}
                onChange={() =>
                  webRTC.onChangeSettings({
                    ...settings,
                    video: !webRTC.settings.video,
                  })
                }
              >
                Join with camera!
              </j-toggle>
            </j-box>

            <j-box pt="500">
              <j-button
                variant="primary"
                size="lg"
                loading={webRTC.isLoading}
                onClick={webRTC.onJoin}
              >
                Join room!
              </j-button>
            </j-box>
          </j-flex>
        </div>
      )}

      <UserGrid webRTC={webRTC} currentUser={agent} />

      <Footer
        webRTC={webRTC}
        onToggleSettings={() => toggleShowSettings(!showSettings)}
      />

      <Overlay webRTC={webRTC} currentUser={agent} />

      <Notifications />
    </section>
  );
}
