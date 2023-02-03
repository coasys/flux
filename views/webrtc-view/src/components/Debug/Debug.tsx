import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";

import styles from "./Debug.module.css";

export default function Debug({ state, localStream }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <h2>Debug</h2>
        <h4>Participants:</h4>
        <ul>
          {state.participants.map((p) => (
            <li key={p.did}>
              <p>{JSON.stringify(p, null, 2)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
