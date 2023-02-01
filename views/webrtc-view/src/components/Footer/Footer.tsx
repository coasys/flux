import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";

import styles from "./Footer.module.css";

export default function Footer() {
  const {
    methods: { addParticipant },
  } = useContext(WebRTCContext);

  const onAddParticipant = () => {
    const newUser = {
      id: String(Math.random()),
      name: "New User",
      candidate: "123",
    };

    addParticipant(newUser);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-button variant="primary" onClick={onAddParticipant}>
          Add fake user
        </j-button>
      </div>
    </div>
  );
}
