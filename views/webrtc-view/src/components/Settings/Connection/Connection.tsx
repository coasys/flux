import { WebRTC } from "utils/react/useWebrtc";
import { useState } from "preact/hooks";
import { defaultIceServers } from "utils/constants/videoSettings";

import styles from "./Connection.module.css";

type Props = {
  webRTC: WebRTC;
};

export default function Connection({ webRTC }: Props) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [credential, setCredential] = useState("");

  async function addServer() {
    const newServer = {
      urls: url,
      username,
      credential,
    };
    const newServers = [...webRTC.iceServers, newServer];
    webRTC.onChangeIceServers(newServers);

    // reset form
    setUrl("");
    setUsername("");
    setCredential("");
    setShowAddNew(false);
  }

  async function removeServer(url: string) {
    const newServers = [...webRTC.iceServers].filter((i) => i.urls !== url);
    webRTC.onChangeIceServers(newServers);
  }

  async function useDefaultServers(url: string) {
    webRTC.onChangeIceServers(defaultIceServers);
  }

  return (
    <div>
      <h3>Connection settings</h3>
      <j-box pt="300">
        <j-text variant="body">ICE/STUN servers</j-text>
      </j-box>

      {!showAddNew && (
        <>
          {webRTC.iceServers.map((s, i) => (
            <div key={s.urls} className={styles.card}>
              <div className={styles.contents}>
                <j-text variant="footnote" color="black" noMargin>
                  {s.urls}
                </j-text>

                {(s.username || s.credential) && (
                  <j-text variant="footnote" noMargin>
                    ({s.username}/{s.credential})
                  </j-text>
                )}
              </div>

              {!webRTC.hasJoined && (
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
              )}
            </div>
          ))}
        </>
      )}

      {!showAddNew && !webRTC.hasJoined && (
        <j-box pt="500">
          <div className={styles.footer}>
            <j-button onClick={() => setShowAddNew(!showAddNew)}>
              Add new server
            </j-button>
            <j-button variant="ghost" onClick={() => useDefaultServers()}>
              Use default
            </j-button>
          </div>
        </j-box>
      )}
      {webRTC.hasJoined && (
        <j-box pt="500">
          <j-text>Leave the current call to make changes.</j-text>
        </j-box>
      )}

      {showAddNew && (
        <>
          <div className={styles.form}>
            <j-input
              value={url}
              placeholder="New STUN/TURN server"
              onchange={(e) => setUrl(e.target.value)}
            ></j-input>

            <j-box pt="400">
              <j-flex a="center" gap="400" direction="row">
                <j-input
                  value={username}
                  placeholder="username"
                  full
                  onchange={(e) => setUsername(e.target.value)}
                ></j-input>
                <j-input
                  value={credential}
                  placeholder="password"
                  full
                  onchange={(e) => setCredential(e.target.value)}
                ></j-input>
              </j-flex>
            </j-box>
          </div>
          <j-box pt="500">
            <div className={styles.footer}>
              <j-button onClick={() => addServer()}>Submit</j-button>
              <j-button variant="ghost" onClick={() => setShowAddNew(false)}>
                Cancel
              </j-button>
            </div>
          </j-box>
        </>
      )}
    </div>
  );
}
