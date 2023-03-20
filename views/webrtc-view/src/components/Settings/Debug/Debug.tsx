import { WebRTC } from "../../../hooks/useWebrtc";
import { Me } from "utils/api/getMe";

import Item from "./Item";

import styles from "./Debug.module.css";
import { defaultSettings } from "../../../constants";
import { Peer } from "../../../types";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function VoiceVideo({ webRTC, currentUser }: Props) {
  const mePeer = {
    did: currentUser.did,
    connection: {
      peerConnection: new RTCPeerConnection(),
      dataChannel: null,
    },
    settings: defaultSettings,
  } as Peer;

  return (
    <>
      <h3>Debug</h3>
      <h4>Connections:</h4>
      <>{!webRTC.hasJoined && "Not yet joined"}</>
      <>
        {webRTC.hasJoined && webRTC.connections.length < 1 && "No connections"}
      </>
      <ul className={styles.list}>
        {webRTC.connections.map((p) => (
          <li key={p.did}>
            <Item peer={p} onSendSignal={webRTC.onSendTestSignal} />
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <j-button
          variant="secondary"
          size="xs"
          onClick={webRTC.onSendTestBroadcast}
          disabled={!webRTC.hasJoined}
        >
          Send broadcast to room
        </j-button>
        <j-button variant="secondary" size="xs" onClick={webRTC.onGetStats}>
          Log RTC stats to console
        </j-button>
        <j-button
          variant="secondary"
          size="xs"
          onClick={() => {
            console.log(webRTC);
          }}
        >
          Log state to console
        </j-button>
      </div>
    </>
  );
}
