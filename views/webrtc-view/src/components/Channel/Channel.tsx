import { useEffect, useContext, useState, useRef } from "preact/hooks";
import subscribeToLinks from "utils/api/subscribeToLinks";
import getMe, { Me } from "utils/api/getMe";

import WebRTCContext from "../../context/WebRTCContext";
import Footer from "../Footer";
import UserGrid from "../UserGrid";

import styles from "./Channel.module.css";

export default function Channel({ uuid, source }) {
  const linkSubscriberRef = useRef<Function | null>(null);
  const [agent, setAgent] = useState<Me | null>(null);

  const [joinClicked, setJoinClicked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const {
    state: { currentUser, localStream },
    methods: {
      setLocalStream,
      setUser,
      addParticipant,
      addIceCandidate,
      addOffer,
      addAnswer,
    },
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

    if (uuid && agent && initialized) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current && linkSubscriberRef.current();
    };
  }, [uuid, agent, initialized]);

  async function handleLinkAdded(link) {
    const isMessageFromSelf = link.author === agent.did;

    if (isMessageFromSelf || !initialized) {
      return;
    }

    // New user has joined the room
    if (link.data.predicate === "join" && link.data.source === source) {
      console.info("New user has joined");

      addParticipant({ did: link.author });
    }

    // A user has provided a candidate
    if (link.data.predicate === "candidate" && link.data.source === source) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === agent.did) {
          console.info("New candidate received", link.data);
          addIceCandidate(parsedData.candidate);
        }
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an answer candidate
    if (
      link.data.predicate === "answer-candidate" &&
      link.data.source === source
    ) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === agent.did) {
          console.info("New answer-candidate received", link.data);
          addIceCandidate(parsedData.candidate);
        }
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an offer
    if (link.data.predicate === "offer" && link.data.source === source) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === agent.did) {
          console.info("New offer received", link.data);
          addOffer(parsedData.offer, parsedData.userId);
        }
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an answer
    if (link.data.predicate === "answer" && link.data.source === source) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === agent.did) {
          console.info("New answer received", link.data);
          addAnswer(parsedData.answer);
        }
      } catch (e) {
        // Oh well
      }
    }
  }

  async function handleLinkRemoved(link) {
    const isMessageFromSelf = link.author === agent.did;

    if (isMessageFromSelf) {
      return;
    }

    console.log("handleLinkRemoved: ", link);

    if (link.predicate === "offer" && link.source === source) {
      // Do something
    }
  }

  // Start local stream
  useEffect(() => {
    const getUserStream = async () => {
      setIsJoining(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Disable video by default
      stream.getVideoTracks()[0].enabled = false;
      setLocalStream(stream);
    };

    if (joinClicked && !localStream) {
      getUserStream();
    }
  }, [joinClicked, localStream]);

  // Add user to local stream once started
  useEffect(() => {
    const addMeAsUser = async () => {
      // Create user object
      const me = {
        did: agent.did,
        prefrences: {
          audio: true,
          video: false,
          screen: false,
        },
      };

      setUser(me);
    };

    if (joinClicked && localStream && !currentUser) {
      addMeAsUser();
    }
  }, [agent, joinClicked, localStream]);

  // Add user to local stream once started
  useEffect(() => {
    const joinStream = async () => {
      // Add user to participants
      addParticipant(currentUser);

      setInitialized(true);
      // WIP: Add user to Ad4m
      // const offer = "123";

      // const client: Ad4mClient = await getAd4mClient();
      // const perspective = await client.perspective.byUUID(uuid);

      // perspective.add({ source, predicate: "offer", target: offer });
    };

    if (joinClicked && localStream && currentUser && !initialized) {
      joinStream();
    }
  }, [joinClicked, localStream, currentUser, initialized]);

  // To-do: Get list of people/offers from Ad4m
  // { name, etc, currentOffer }
  const people = [] as string[];

  return (
    <section className={styles.outer}>
      <UserGrid />
      {!localStream && (
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

      {localStream && (
        <div className={styles.debug}>
          <h3>LocalStream status:</h3>
          <p>ID: {localStream.id}</p>
          <p>active: {localStream.active ? "YES" : "NO"}</p>
          <ul></ul>
        </div>
      )}

      <Footer />
    </section>
  );
}
