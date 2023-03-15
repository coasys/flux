import { Me } from "utils/api/getMe";
import { WebRTC } from "../../../hooks/useWebrtc";

import styles from "./ItemMe.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function ItemMe({ currentUser, webRTC }: Props) {
  return (
    <div className={styles.item}>
      <j-text variant="heading">Connection #1 (me)</j-text>
      <j-text variant="footnote">{currentUser?.did}</j-text>

      <div className={styles.row}>
        <j-text variant="label" nomargin>
          Devices:
        </j-text>
        <span>test</span>
      </div>

      {/* <div className={styles.row}>
        <j-text variant="label" nomargin>
          Heartbeat received:
        </j-text>
        <span>{"loadingState"}</span>
      </div> */}
    </div>
  );
}
