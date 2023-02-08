import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/UiContext";

import styles from "./Debug.module.css";

export default function Debug({ connections }) {
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
      </div>
    </div>
  );
}
