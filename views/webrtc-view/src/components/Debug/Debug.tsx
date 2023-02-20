import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/UiContext";
import { Peer } from "../../types";
import { Ad4mClient, Link, Literal } from "@perspect3vism/ad4m";
import { Me } from "utils/api/getMe";

import DebugItem from "./DebugItem";

import styles from "./Debug.module.css";

type Props = {
  connections: Peer[];
  onSendTestSignal: (recipientId: string) => void;
  onSendTestBroadcast: () => void;
};

export default function Debug({
  connections,
  onSendTestSignal,
  onSendTestBroadcast,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <h2>Debug</h2>
        <h4>Connections:</h4>
        <ul>
          {connections.map((p) => (
            <li key={p.did}>
              <p>{JSON.stringify(p, null, 2)}</p>
            </li>
          ))}
        </ul>
        <div className={styles.box}>
          <j-button variant="primary" onClick={onSendTestBroadcast}>
            Send broadcast to everyone
          </j-button>
        </div>
        <div className={styles.box}>
          <ul className={styles.list}>
            {connections.map((c) => (
              <li key={c.did}>
                <DebugItem
                  userId={c.did}
                  onClick={() => onSendTestSignal(c.did)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
