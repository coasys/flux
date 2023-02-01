import { useRef, useContext, useEffect } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";
import Item from "./Item";

import styles from "./UserGrid.module.css";

export default function UserGrid() {
  const videoRef = useRef(null);

  const {
    state: { currentUser, participants, stream },
  } = useContext(WebRTCContext);

  const cameraEnabled = currentUser && currentUser.prefrences.video;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
    }
  }, [videoRef, currentUser, stream]);

  return (
    <section className={styles.grid}>
      {currentUser && (
        <Item
          data={currentUser}
          videoRef={videoRef}
          cameraEnabled={cameraEnabled}
        />
      )}
      {participants.map((p) => (
        <Item key={p.id} data={p} />
      ))}
    </section>
  );
}
