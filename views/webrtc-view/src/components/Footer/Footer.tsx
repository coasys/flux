import { useContext } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";

import styles from "./Footer.module.css";

export default function Footer() {
  const {
    state: { stream, currentUser },
    methods: { addParticipant, setUserPrefrences },
  } = useContext(WebRTCContext);

  const cameraEnabled = currentUser && currentUser.prefrences.video;

  const onAddParticipant = () => {
    const newUser = {
      id: String(Math.random()),
      name: "New User",
      candidate: "123",
    };

    addParticipant(newUser);
  };

  const onToggleCamera = () => {
    if (stream) {
      const newCameraSetting = !currentUser.prefrences?.video;
      stream.getVideoTracks()[0].enabled = newCameraSetting;
      setUserPrefrences({ ...currentUser.prefrences, video: newCameraSetting });
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <j-button variant="primary" onClick={onToggleCamera} disabled={!stream}>
          {cameraEnabled ? "Disable camera" : "Enable camera"}
        </j-button>
        <j-button variant="primary" onClick={onAddParticipant}>
          Add fake user
        </j-button>
      </div>
    </div>
  );
}
