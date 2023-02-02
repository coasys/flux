import { useEffect, useContext, useState, useRef } from "preact/hooks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";
import subscribeToLinks from "utils/api/subscribeToLinks";
import getMe, { Me } from "utils/api/getMe";
import { createOffer, createPeerConnection } from "../../../utils/webrtc";

import WebRTCContext from "../../context/WebRTCContext";
import Footer from "../Footer";
import UserGrid from "../UserGrid";

import styles from "./Channel.module.css";

export default function Channel({ uuid, source }) {
  const linkSubscriberRef = useRef<Function | null>(null);
  const [agent, setAgent] = useState<Me | null>(null);

  const [joinClicked, setJoinClicked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const {
    state: { stream },
    methods: { setStream, setUser, addParticipant },
  } = useContext(WebRTCContext);

  // Get agent/me
  useEffect(() => {
    async function fetchAgent() {
      const agent = await getMe();
      setAgent(agent);
    }

    fetchAgent();
  }, []);

  // Setup subscriptions
  useEffect(() => {
    async function setupSubscribers() {
      linkSubscriberRef.current = await subscribeToLinks({
        perspectiveUuid: uuid,
        added: handleLinkAdded,
        removed: handleLinkRemoved,
      });
    }

    if (uuid && agent) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current && linkSubscriberRef.current();
    };
  }, [uuid, agent]);

  async function handleLinkAdded(link) {
    const isMessageFromSelf = link.author === agent.did;

    console.log("handleLinkAdded: ", link);

    if (link.predicate === "offer" && link.source === source) {
      // Do something
    }
  }

  async function handleLinkRemoved(link) {
    const isMessageFromSelf = link.author === agent.did;

    console.log("handleLinkRemoved: ", link);

    if (link.predicate === "offer" && link.source === source) {
      // Do something
    }
  }

  // Start local stream
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

      // Create user object
      const currentUser = {
        did: agent.did,
        prefrences: {
          audio: true,
          video: false,
          screen: false,
        },
      };

      // Add user to local state
      setUser(currentUser);

      // Add user to local state
      addParticipant(currentUser);

      // WIP: Add user to Ad4m
      // const offer = "123";

      // const client: Ad4mClient = await getAd4mClient();
      // const perspective = await client.perspective.byUUID(uuid);

      // perspective.add({ source, predicate: "offer", target: offer });
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
          <ul></ul>
        </div>
      )}

      <Footer />
    </section>
  );
}
