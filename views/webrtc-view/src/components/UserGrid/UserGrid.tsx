import { useRef, useContext, useEffect } from "preact/hooks";
import WebRTCContext from "../../context/WebRTCContext";
import Item from "./Item";

import styles from "./UserGrid.module.css";

export default function UserGrid({ currentUser, participants, localStream }) {
  const videoRef = useRef(null);

  const participantsWithoutMe = participants.filter((p) => !p.isCurrentUser);
  const cameraEnabled = currentUser && currentUser.prefrences.video;
  const userCount = participantsWithoutMe.length + (currentUser ? 1 : 0);

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
      videoRef.current.srcObject = localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, currentUser, localStream]);

  // Build participant elements
  const participantsItems = participantsWithoutMe.map((participant, index) => {
    const remoteStream = new MediaStream();

    if (participant.peerConnection) {
      participant.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        const videElement = document.getElementById(
          `user-video-${participant.did}`
        ) as HTMLVideoElement;

        if (videElement) {
          videElement.srcObject = remoteStream;
        }
      };
    }

    return (
      <Item key={participant.did} data={participant} cameraEnabled={true} />
    );
  });

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
      {participantsItems}
    </section>
  );
}
