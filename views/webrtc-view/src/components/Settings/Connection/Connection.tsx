import { Me } from "@fluxapp/api";
import { WebRTC } from "@fluxapp/react-web";
import { useState } from "preact/hooks";
import { videoSettings } from "@fluxapp/constants";

import styles from "./Connection.module.css";

type Props = {
  webRTC: WebRTC;
};

export default function Connection({ webRTC }: Props) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newServer, setNewServer] = useState("");

  async function addServer(url: string) {
    const newServers = [...webRTC.iceServers];
    webRTC.onChangeIceServers(newServers);
  }

  async function removeServer(url: string) {
    const newServers = [...webRTC.iceServers].filter((i) => i.urls !== url);
    webRTC.onChangeIceServers(newServers);
  }

  async function useDefaultServers(url: string) {
    webRTC.onChangeIceServers(videoSettings.defaultIceServers);
  }

  return (
    <div>
      <h3>Connection settings</h3>
      <j-box pt="300">
        <j-text variant="body">ICE/STUN servers</j-text>
      </j-box>

      <>
        {webRTC.iceServers.map((s, i) => (
          <div key={s.urls} className={styles.card}>
            <div className={styles.contents}>
              <j-text variant="footnote" color="black" noMargin>
                {s.urls}
              </j-text>

              <>
                {(s.username || s.credential) && (
                  <j-text variant="footnote" noMargin>
                    ({s.username}/{s.credential})
                  </j-text>
                )}
              </>
            </div>

            <div className={styles.actions}>
              <j-button
                size="sm"
                squared
                class="delete-button"
                variant="ghost"
                onClick={() => removeServer(s.urls)}
              >
                <j-icon name="x"></j-icon>
              </j-button>
            </div>
          </div>
        ))}
      </>

      <j-box pt="500">
        {!showAddNew && (
          <div className={styles.footer}>
            <j-button onClick={() => setShowAddNew(!showAddNew)}>
              Add new server
            </j-button>
            <j-button variant="ghost" onClick={() => useDefaultServers()}>
              Use default
            </j-button>
          </div>
        )}

        <>
          {showAddNew && (
            <j-input
              value={newServer}
              placeholder="New STUN/TURN server"
              onchange={(e) => setNewServer(e.target.value)}
            ></j-input>
          )}
        </>
      </j-box>
    </div>
  );
}
