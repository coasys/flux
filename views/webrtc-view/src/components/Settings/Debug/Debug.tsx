import { WebRTC } from "../../../hooks/useWebrtc";
import { Me } from "utils/api/getMe";

import Item from "./Item";

import styles from "./Debug.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function VoiceVideo({ webRTC, currentUser }: Props) {
  return (
    <>
      <h3>Debug</h3>
      <h4>Connections:</h4>
      <>{!webRTC.hasJoined && "Not yet joined"}</>
      <ul>
        {webRTC.connections.map((p) => (
          <li key={p.did}>
            <p>{JSON.stringify(p, null, 2)}</p>
          </li>
        ))}
      </ul>
      <h4>Send test broadcast:</h4>
      <div className={styles.box}>
        <j-button
          variant="primary"
          onClick={webRTC.onSendTestBroadcast}
          disabled={!webRTC.hasJoined}
        >
          Send broadcast to everyone
        </j-button>
      </div>
      <h4>Send test signals:</h4>
      <div className={styles.box}>
        <ul className={styles.list}>
          <li>
            <Item
              userId={currentUser.did}
              isSelf
              disabled={!webRTC.hasJoined}
              onClick={() => onSendTestSignal(currentUser.did)}
            />
          </li>
          {webRTC.connections.map((c) => (
            <li key={c.did}>
              <Item
                userId={c.did}
                disabled={!webRTC.hasJoined}
                onClick={() => onSendTestSignal(c.did)}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
