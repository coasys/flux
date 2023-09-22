import { Me } from "@fluxapp/api";
import { WebRTC } from "@fluxapp/react-web";

import Item from "./Item";
import ItemMe from "./ItemMe";

import styles from "./Debug.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function Debugger({ webRTC, currentUser }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <ul className={styles.list}>
          <li>
            <ItemMe currentUser={currentUser} webRTC={webRTC} />
          </li>
          {webRTC.connections.map((p, i) => (
            <li key={p.did}>
              <Item index={i + 2} peer={p} />
            </li>
          ))}
        </ul>
        <div className={styles.footer}>
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
      </div>
    </div>
  );
}
