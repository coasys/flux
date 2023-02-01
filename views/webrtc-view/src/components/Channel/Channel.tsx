import { useEffect, useContext, useState } from "preact/hooks";
import CommunityModel, { Community } from "utils/api/community";
import WebRTCContext from "../../context/WebRTCContext";
import Footer from "../Footer";
import UserGrid from "../UserGrid";

import styles from "./Channel.module.css";

export default function Channel({ uuid, source }) {
  const [joinClicked, setJoinClicked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const {
    state: { stream },
    methods: { setStream, setUser },
  } = useContext(WebRTCContext);

  useEffect(() => {
    const getUserStream = async () => {
      setIsJoining(true);

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Disable video by default
      localStream.getVideoTracks()[0].enabled = false;
      setStream(localStream);

      // WIP: Add user to Ad4m

      // Add user to local state
      setUser({
        id: "123",
        name: "You",
        candidate: "123",
        prefrences: {
          audio: true,
          video: false,
          screen: false,
        },
      });
    };

    if (joinClicked && !stream) {
      getUserStream();
    }
  }, [joinClicked, stream]);

  // To-do: Get list of people/offers from Ad4m
  // { name, etc, currentOffer }
  const people = [] as string[];

  return (
    <section className={styles.outer}>
      <UserGrid />
      {!stream && (
        <div className={styles.join}>
          <h1>You haven't joined this room</h1>
          <p>Your video will be off by default.</p>
          <j-button
            variant="primary"
            size="lg"
            loading={isJoining}
            onClick={() => setJoinClicked(true)}
          >
            Join room!
          </j-button>
        </div>
      )}

      {stream && (
        <div className={styles.debug}>
          <h3>Stream status:</h3>
          <p>ID: {stream.id}</p>
          <p>active: {stream.active ? "YES" : "NO"}</p>
        </div>
      )}

      <Footer />
    </section>
  );
}
