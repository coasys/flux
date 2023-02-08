import { useContext } from "preact/hooks";
import UiContext from "../../context/UiContext";
import WebRTCContext from "../../context/UiContext";
import Item from "./Item";

import styles from "./Notifications.module.css";

export default function Notifications() {
  const {
    state: { notifications },
  } = useContext(UiContext);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {notifications.map((n) => (
          <li key={n.userId} className={styles.item}>
            <Item data={n} />
          </li>
        ))}
      </ul>
    </div>
  );
}
