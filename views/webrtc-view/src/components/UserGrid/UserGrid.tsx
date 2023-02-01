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
  const userCount = participants.length + (currentUser ? 1 : 0);

  // Grid sizing
  let gridCol = userCount === 1 ? 1 : userCount <= 4 ? 2 : 4;
  const gridColSize = userCount <= 4 ? 1 : 2;
  let gridRowSize = userCount <= 4 ? userCount : Math.ceil(userCount / 2);

  // if (screenPresenter) {
  //   gridCol = 1;
  //   gridRowSize = 2;
  // }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
    }
  }, [videoRef, currentUser, stream]);

  return (
    <section
      className={styles.grid}
      style={{
        "--grid-size": gridCol,
        "--grid-col-size": gridColSize,
        "--grid-row-size": gridRowSize,
      }}
    >
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
