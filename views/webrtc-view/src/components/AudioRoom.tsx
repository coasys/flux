import { useState } from "preact/hooks";
import CommunityModel, { Community } from "utils/api/community";
import styles from "../App.module.css";

export default function AudioRoom() {
  const [currentOffer, setCurrentOffer] = useState<
    RTCSessionDescriptionInit | undefined
  >(undefined);
  const [hasJoined, setHasJoined] = useState(false);

  // Triggered when a new candidate is created
  // (I think due to a change in the network etc)
  const handleicecandidate = (event) => {
    if (event.candidate) {
      console.log("icecandidate: ", event.candidate);
      // send the new `event.candidate` to Ad4m
    }
  };

  const handleconnectionstatechange = (event) => {
    console.log("handleconnectionstatechange: ", event);
  };

  const handleiceconnectionstatechange = (event) => {
    console.log("handleiceconnectionstatechange: ", event);
  };

  const onJoin = async () => {
    console.log("Connecting...");

    const servers: RTCConfiguration = {
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
      iceCandidatePoolSize: 10,
    };

    const peerConnection = new RTCPeerConnection(servers);

    peerConnection.onicecandidate = handleicecandidate;
    peerConnection.onconnectionstatechange = handleconnectionstatechange;
    peerConnection.oniceconnectionstatechange = handleiceconnectionstatechange;

    // Create offer
    const createOfferPromise = peerConnection.createOffer();
    const offerResults = await createOfferPromise;

    // To-DO: Send offer to Ad4m

    setCurrentOffer(offerResults);

    // Create local stream requesting access to video and audio
    // const localStream = await navigator.mediaDevices.getUserMedia({
    //   video: true,
    //   audio: true,
    // });

    // // Create remote stream using the MediaStream interface
    // const remoteStream = new MediaStream();

    // // Push tracks from local stream to peer connection
    // localStream.getTracks().forEach((track) => {
    //   peerConnection.addTrack(track, localStream);
    // });

    // // Pull tracks from remote stream, add to video stream
    // peerConnection.addEventListener("track", (event) => {
    //   event.streams[0].getTracks().forEach((track) => {
    //     remoteStream.addTrack(track);
    //   });
    // });
  };

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
        {currentOffer && (
          <div className={styles.debug}>
            <h3>RTCSessionDescription:</h3>
            <p>type: {currentOffer.type}</p>
            <p>SDP: {currentOffer.sdp}</p>
          </div>
        )}
        <j-button onClick={onJoin}>Join chat!</j-button>
      </div>
    </section>
  );
}
