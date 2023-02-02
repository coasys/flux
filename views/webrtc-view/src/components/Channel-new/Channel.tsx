import { Component } from "preact";
import {
  useEffect,
  useContext,
  useState,
  useRef,
  useCallback,
} from "preact/hooks";
import subscribeToLinks from "utils/api/subscribeToLinks";
import getMe, { Me } from "utils/api/getMe";

import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";

import WebRTCContext from "../../context/WebRTCContext";
import Footer from "../Footer";
import UserGrid from "../UserGrid";

import styles from "./Channel.module.css";

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.services.mozilla.com",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

type StreamUserPrefrences = {
  audio: boolean;
  video: boolean;
  screen: boolean;
};

type OfferCandidate = {
  userId: string;
};

type StreamUser = {
  did: string;
  isCurrentUser?: boolean;
  candidate?: string;
  peerConnection?: RTCPeerConnection;
  offerCandidates?: OfferCandidate[];
  offers?: RTCLocalSessionDescriptionInit[];
  prefrences?: StreamUserPrefrences;
};

type Props = {
  uuid: string;
  source: string;
};

type State = {
  agent: Me;
  joinClicked: boolean;
  isJoining: boolean;
  initialized: boolean;
  currentUser: StreamUser;
  localStream: MediaStream | null;
  participants: StreamUser[];
};

class Channel extends Component<Props, State> {
  linkSubscriberRef: Function;

  constructor(props) {
    super(props);

    this.linkSubscriberRef = null;

    this.state = {
      agent: null,
      joinClicked: false,
      isJoining: false,
      initialized: false,
      currentUser: null,
      localStream: null,
      participants: [],
    };
  }

  async componentDidMount() {
    const agent = await getMe();
    this.setState({ ...this.state, agent });

    // Setup subscriptions
    this.linkSubscriberRef = await subscribeToLinks({
      perspectiveUuid: this.props.uuid,
      added: (link) => this.handleLinkAdded(link),
      removed: (link) => this.handleLinkRemoved(link),
    });
  }

  componentWillUnmount() {
    // clear subscriptions
    this.linkSubscriberRef();
  }

  async handleLinkAdded(link) {
    const isMessageFromSelf = link.author === this.state.agent.did;

    if (isMessageFromSelf) {
      console.log("🚫 Link is from me, skipping!");
      return;
    }

    if (!this.state.initialized) {
      console.log("🚫 Not yet joined, skipping!");
      return;
    }

    // Check if user doesn't exist in participants (user joined before us)
    if (
      link.data.predicate !== "join" &&
      !this.state.participants.some((p) => p.did === link.author)
    ) {
      console.info("🧍🏽 Adding existing user");

      this.addParticipant({ did: link.author });
    }

    // New user has joined the room
    if (
      link.data.predicate === "join" &&
      link.data.source === this.props.source
    ) {
      console.info("🧍🏽 New user has joined");

      this.addParticipant({ did: link.author });
    }

    // A user has provided a candidate
    if (
      link.data.predicate === "candidate" &&
      link.data.source === this.props.source
    ) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === this.state.agent.did) {
          console.info("📚 New candidate received", parsedData.candidate);
          await this.addIceCandidate(parsedData.candidate);
        }
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an answer candidate
    if (
      link.data.predicate === "answer-candidate" &&
      link.data.source === this.props.source
    ) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === this.state.agent.did) {
          console.info(
            "📚 New answer-candidate received",
            parsedData.candidate
          );
          this.addIceCandidate(parsedData.candidate);
        }
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an offer
    if (
      link.data.predicate === "offer" &&
      link.data.source === this.props.source
    ) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === this.state.agent.did) {
          console.info("📚 New offer received", link.data);
          this.addOffer(parsedData.offer, parsedData.userId);
        }
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an answer
    if (
      link.data.predicate === "answer" &&
      link.data.source === this.props.source
    ) {
      try {
        const parsedData = JSON.parse(link.data.target);

        // Check if the candidate us for us
        if (parsedData.receiverId === this.state.agent.did) {
          console.info("📚 New answer received", link.data);
          this.addAnswer(parsedData.answer);
        }
      } catch (e) {
        // Oh well
      }
    }
  }

  async addIceCandidate(candidate: RTCIceCandidate) {
    const myPeerConnection = this.state.participants.find(
      (p) => p.did === this.state.currentUser.did
    )?.peerConnection;

    await myPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async handleLinkRemoved(link) {
    const isMessageFromSelf = link.author === this.state.agent.did;

    if (isMessageFromSelf) {
      return;
    }

    console.log("handleLinkRemoved: ", link);

    if (link.predicate === "offer" && link.source === this.props.source) {
      // Do something
    }
  }

  async sendCandidateToParticipant(
    receiverId: string,
    createdById: string,
    candidate: RTCIceCandidate
  ) {
    const offerCandidateData = {
      candidate,
      receiverId,
      userId: createdById,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    console.log("⚡️ sendCandidateToParticipant");
    await perspective.add({
      source: this.props.source,
      predicate: "candidate",
      target: JSON.stringify(offerCandidateData),
    });
  }

  async sendOfferToParticipant(
    receiverId: string,
    createdById: string,
    offer: RTCLocalSessionDescriptionInit
  ) {
    const offerData = {
      receiverId,
      userId: createdById,
      offer,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    console.log("⚡️ sendOfferToParticipant");
    await perspective.add({
      source: this.props.source,
      predicate: "offer",
      target: JSON.stringify(offerData),
    });
  }

  async sendAnswerCandidateToParticipant(
    receiverId: string,
    createdById: string,
    candidate: RTCIceCandidate
  ) {
    const answerCandidateData = {
      candidate,
      receiverId,
      userId: createdById,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    console.log("⚡️ sendAnswerCandidateToParticipant");
    await perspective.add({
      source: this.props.source,
      predicate: "answer-candidate",
      target: JSON.stringify(answerCandidateData),
    });
  }

  async sendAnswerToCandidate(
    receiverId: string,
    createdById: string,
    answer: RTCLocalSessionDescriptionInit
  ) {
    const answerData = {
      receiverId,
      userId: createdById,
      answer,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    console.log("⚡️ sendAnswerToCandidate");
    await perspective.add({
      source: this.props.source,
      predicate: "answer",
      target: JSON.stringify(answerData),
    });
  }

  async createOffer(
    peerConnection: RTCPeerConnection,
    receiverId: string,
    createdID: string
  ) {
    // Send offer candidate
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const json = event.candidate.toJSON() as RTCIceCandidate;
        await this.sendCandidateToParticipant(receiverId, createdID, json);
      }
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Send offer
    await this.sendOfferToParticipant(receiverId, createdID, offer);
  }

  async createAnswer(
    peerConnection: RTCPeerConnection,
    createdID: string,
    receiverId: string
  ) {
    // Send answer candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendAnswerCandidateToParticipant(
          receiverId,
          createdID,
          event.candidate
        );
      }
    };

    const answerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      sdp: answerDescription.sdp,
      type: answerDescription.type,
    };

    // Send answer
    await this.sendAnswerToCandidate(receiverId, createdID, answer);
  }

  async addOffer(offer: RTCLocalSessionDescriptionInit, senderId: string) {
    const myPeerConnection = this.state.participants.find(
      (p) => p.did === this.state.currentUser.did
    )?.peerConnection;

    const otherUserPeerConnection = this.state.participants.find(
      (p) => p.did === senderId
    )?.peerConnection;

    // Add offer to my connection
    await myPeerConnection.setRemoteDescription(
      new RTCSessionDescription(offer as RTCSessionDescriptionInit)
    );

    this.createAnswer(
      otherUserPeerConnection,
      this.state.currentUser.did,
      senderId
    );
  }

  addAnswer(answer: RTCLocalSessionDescriptionInit) {
    const myPeerConnection = this.state.participants.find(
      (p) => p.did === this.state.currentUser.did
    )?.peerConnection;

    console.log("adding answer: ", answer);
    console.log("myPeerConnection: ", myPeerConnection);

    // Add answer to my connection
    myPeerConnection.setRemoteDescription(
      new RTCSessionDescription(answer as RTCSessionDescriptionInit)
    );
  }

  async addConnectionToUser(
    newUser: StreamUser,
    currentUser: StreamUser,
    stream: MediaStream
  ) {
    const newPeerConnection = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => {
      newPeerConnection.addTrack(track, stream);
    });

    const newUserId = newUser.did;
    const currentUserId = currentUser.did;

    const offerIds = [newUserId, currentUserId].sort((a, b) =>
      a.localeCompare(b)
    );

    newUser.peerConnection = newPeerConnection;
    if (offerIds[0] !== currentUserId) {
      await this.createOffer(newPeerConnection, offerIds[0], offerIds[1]);
    }

    return newUser;
  }

  async addParticipant(user: StreamUser) {
    const alreadyJoined = this.state.participants.find(
      (p) => p.did === user.did
    );

    if (alreadyJoined) {
      console.info("User already joined, aborting");
      return;
    }

    const newUserWithConnection = await this.addConnectionToUser(
      user,
      this.state.currentUser,
      this.state.localStream
    );

    const isCurrentUser = user.did === this.state.currentUser.did;

    this.setState((oldState) => ({
      ...oldState,
      participants: [
        ...oldState.participants,
        { ...newUserWithConnection, isCurrentUser },
      ],
    }));
  }

  async onJoin() {
    this.setState((oldState) => ({
      ...oldState,
      isJoining: true,
    }));

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Disable video by default
    stream.getVideoTracks()[0].enabled = false;

    // Create user object
    const me = {
      did: this.state.agent.did,
      prefrences: {
        audio: true,
        video: false,
        screen: false,
      },
    };

    // Announce my arrival
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    console.log("⚡️ Sending join!");
    perspective.add({
      source: this.props.source,
      predicate: "join",
      target: this.props.source,
    });

    this.setState(
      (oldState) => ({
        ...oldState,
        localStream: stream,
        initialized: true,
        currentUser: me,
      }),
      () => {
        this.addParticipant(this.state.currentUser);
      }
    );
  }

  onToggleCamera() {
    if (this.state.localStream) {
      const newCameraSetting = !this.state.currentUser.prefrences?.video;
      this.state.localStream.getVideoTracks()[0].enabled = newCameraSetting;

      const newPrefrences = {
        ...this.state.currentUser.prefrences,
        video: newCameraSetting,
      };
      this.setState((oldState) => ({
        ...oldState,
        currentUser: { ...this.state.currentUser, prefrences: newPrefrences },
      }));
    }
  }

  render() {
    1;
    return (
      <section className={styles.outer}>
        <UserGrid
          currentUser={this.state.currentUser}
          participants={this.state.participants}
          localStream={this.state.localStream}
        />

        {!this.state.localStream && (
          <div className={styles.join}>
            <h1>You haven't joined this room</h1>
            <p>Your video will be off by default.</p>
            <j-button
              variant="primary"
              size="lg"
              loading={this.state.isJoining}
              onClick={() => this.onJoin()}
            >
              Join room!
            </j-button>
          </div>
        )}

        {this.state.localStream && (
          <div className={styles.debug}>
            <h3>LocalStream status:</h3>
            <p>ID: {this.state.localStream.id}</p>
            <p>User count: {this.state.participants.length}</p>
            <p>active: {this.state.localStream.active ? "YES" : "NO"}</p>
            <ul></ul>
          </div>
        )}

        <Footer
          localStream={this.state.localStream}
          currentUser={this.state.currentUser}
          onToggleCamera={() => this.onToggleCamera()}
        />
      </section>
    );
  }
}

export default Channel;
