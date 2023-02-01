import { useEffect, useContext, useState } from "preact/hooks";
import CommunityModel, { Community } from "utils/api/community";
import WebRTCContext from "../context/WebRTCContext";

import styles from "../App.module.css";

export default function Channel({ uuid, source }) {
  const {
    state: { stream },
    methods: { setStream },
  } = useContext(WebRTCContext);
  const [joinClicked, setJoinClicked] = useState(false);

  useEffect(() => {
    const getUserStream = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Disable video by default
      localStream.getVideoTracks()[0].enabled = false;

      setStream(localStream);
    };

    if (joinClicked && !stream) {
      getUserStream();
    }
  }, [joinClicked, stream]);

  // useEffect(async () => {
  //   const getUserStream = async () => {
  //     const localStream = await navigator.mediaDevices.getUserMedia({
  //       audio: true,
  //       video: true,
  //     });

  //     return localStream;
  //   };

  //   const stream = await getUserStream();
  //   stream.getVideoTracks()[0].enabled = false;
  //   props.setMainStream(stream);

  //   connectedRef.on("value", (snap) => {
  //     if (snap.val()) {
  //       const defaultPreference = {
  //         audio: true,
  //         video: false,
  //         screen: false,
  //       };
  //       const userStatusRef = participantRef.push({
  //         userName,
  //         preferences: defaultPreference,
  //       });
  //       props.setUser({
  //         [userStatusRef.key]: { name: userName, ...defaultPreference },
  //       });
  //       userStatusRef.onDisconnect().remove();
  //     }
  //   });
  // }, []);

  // To-do: Get list of people/offers from Ad4m
  // { name, etc, currentOffer }
  const people = [] as string[];

  return (
    <section className={styles.outer}>
      <div>
        <h2>People in room:</h2>
        <ul>
          {people.map((p) => (
            <j-avatar key={p} initials={p.charAt(0)}></j-avatar>
          ))}
          <li>No people in room</li>
        </ul>
      </div>
      <div>
        <h2>Get talking</h2>
        {stream && (
          <div className={styles.debug}>
            <h3>Stream status:</h3>
            <p>ID: {stream.id}</p>
            <p>active: {stream.active}</p>
          </div>
        )}
        {!stream && (
          <j-button onClick={() => setJoinClicked(true)}>Join chat!</j-button>
        )}
      </div>
    </section>
  );
}
