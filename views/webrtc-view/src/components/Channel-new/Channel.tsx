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
import { Ad4mClient, Literal } from "@perspect3vism/ad4m";

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
  joinClicked: boolean;
  isJoining: boolean;
  initialized: boolean;
  currentUser: StreamUser;
  participants: StreamUser[];
};

class Channel extends Component<Props, State> {
  linkSubscriberRef: Function | null;
  localStream: MediaStream | null;
  agent: Me | null;

  constructor(props) {
    super(props);

    this.linkSubscriberRef = null;
    this.localStream = null;
    this.agent = null;

    this.state = {
      joinClicked: false,
      isJoining: false,
      initialized: false,
      currentUser: null,
      participants: [],
    };
  }

  async componentDidMount() {
    this.agent = await getMe();

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
    if (link.data.source !== this.props.source) {
      console.log("🚫 Wrong link source, skipping!");
      return;
    }

    if (link.author === this.agent.did) {
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
    if (link.data.predicate === "join") {
      console.info("🧍🏽 New user has joined");

      this.addParticipant({ did: link.author });
    }

    // New user has joined the room
    if (link.data.predicate === "leave") {
      console.info("🚶🏻‍♀️ User has left");

      this.setState((oldState) => ({
        ...oldState,
        participants: [
          ...oldState.participants.filter((p) => p.did !== link.data.target),
        ],
      }));
    }

    // A user has provided an offer
    if (link.data.predicate === "offer") {
      try {
        const parsedData = Literal.fromUrl(link.data.target).get();

        if (parsedData.receiverId !== this.agent.did) {
          return; // Offer is not for us!
        }

        console.info("🔵 [INCOMING] New offer received");

        const offerCreator = this.state.participants.find(
          (p) => p.did === parsedData.creatorId
        );

        await offerCreator.peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedData.offer)
        );

        offerCreator.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendAnswerCandidateToParticipant(
              offerCreator.did,
              this.agent.did,
              event.candidate
            );
          }
        };

        const answerDescription =
          await offerCreator.peerConnection.createAnswer();
        await offerCreator.peerConnection.setLocalDescription(
          answerDescription
        );

        const answer = {
          sdp: answerDescription.sdp,
          type: answerDescription.type,
        };

        // Send answer
        await this.sendAnswerToCandidate(
          offerCreator.did,
          this.agent.did,
          answer
        );
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided a candidate
    if (link.data.predicate === "offer-candidate") {
      try {
        const parsedData = Literal.fromUrl(link.data.target).get();

        if (parsedData.receiverId !== this.agent.did) {
          return; // Offer is not for us!
        }

        console.info("🔵 [INCOMING] New candidate received");

        const targetUser = this.state.participants.find(
          (p) => p.did === parsedData.userId
        );
        targetUser.peerConnection.addIceCandidate(parsedData.candidate);
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an answer
    if (link.data.predicate === "answer") {
      try {
        const parsedData = Literal.fromUrl(link.data.target).get();

        if (parsedData.receiverId !== this.agent.did) {
          return; // Offer is not for us!
        }

        console.info("🔵 [INCOMING] New answer received");

        const targetUser = this.state.participants.find(
          (p) => p.did === parsedData.userId
        );

        const answerDescription = new RTCSessionDescription(parsedData.answer);
        targetUser.peerConnection.setRemoteDescription(answerDescription);
      } catch (e) {
        // Oh well
      }
    }

    // A user has provided an answer candidate
    if (link.data.predicate === "answer-candidate") {
      try {
        const parsedData = Literal.fromUrl(link.data.target).get();

        if (parsedData.receiverId !== this.agent.did) {
          return; // Offer is not for us!
        }

        console.info("🔵 [INCOMING] New answer-candidate received");

        const targetUser = this.state.participants.find(
          (p) => p.did === parsedData.userId
        );

        targetUser.peerConnection.addIceCandidate(
          new RTCIceCandidate(parsedData.candidate)
        );
      } catch (e) {
        // Oh well
      }
    }
  }

  async handleLinkRemoved(link) {
    const isMessageFromSelf = link.author === this.agent.did;

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
    const expressionUrl = Literal.from(offerCandidateData).toUrl();

    console.log("🟠 [OUTGOING] sendCandidateToParticipant");
    await perspective.add({
      source: this.props.source,
      predicate: "offer-candidate",
      target: expressionUrl,
    });
  }

  async sendOfferToParticipant(
    receiverId: string,
    createdById: string,
    offer: RTCLocalSessionDescriptionInit
  ) {
    const offerData = {
      receiverId,
      creatorId: createdById,
      offer,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);
    const expressionUrl = Literal.from(offerData).toUrl();

    console.log("🟠 [OUTGOING] sendOfferToParticipant");
    await perspective.add({
      source: this.props.source,
      predicate: "offer",
      target: expressionUrl,
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
    const expressionUrl = Literal.from(answerCandidateData).toUrl();

    console.log("🟠 [OUTGOING] sendAnswerCandidateToParticipant");
    await perspective.add({
      source: this.props.source,
      predicate: "answer-candidate",
      target: expressionUrl,
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
    const expressionUrl = Literal.from(answerData).toUrl();

    console.log("🟠 [OUTGOING] sendAnswerToCandidate");
    await perspective.add({
      source: this.props.source,
      predicate: "answer",
      target: expressionUrl,
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
      this.localStream
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

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Disable video by default
    this.localStream.getVideoTracks()[0].enabled = false;

    // Create user object
    const me = {
      did: this.agent.did,
      prefrences: {
        audio: true,
        video: false,
        screen: false,
      },
    };

    this.setState((oldState) => ({
      ...oldState,
      currentUser: me,
    }));

    // Announce my arrival
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    console.log("🟠 [OUTGOING] Sending join!");
    perspective.add({
      source: this.props.source,
      predicate: "join",
      target: this.props.source,
    });

    await this.addParticipant(me);

    this.setState((oldState) => ({
      ...oldState,
      initialized: true,
    }));
  }

  onToggleCamera() {
    if (this.localStream) {
      const newCameraSetting = !this.state.currentUser.prefrences?.video;
      this.localStream.getVideoTracks()[0].enabled = newCameraSetting;

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

  async onLeave() {
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(this.props.uuid);

    perspective.remove({
      source: this.props.source,
      predicate: "leave",
      target: this.agent.did,
    });

    this.localStream = null;

    this.setState((oldState) => ({
      ...oldState,
      joinClicked: false,
      isJoining: false,
      initialized: false,
      currentUser: null,
      participants: [],
    }));
  }

  render() {
    1;
    return (
      <section className={styles.outer}>
        <UserGrid
          currentUser={this.state.currentUser}
          participants={this.state.participants}
          localStream={this.localStream}
        />

        {!this.localStream && (
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

        {this.localStream && (
          <div className={styles.debug}>
            <h3>LocalStream status:</h3>
            <p>ID: {this.localStream.id}</p>
            <p>User count: {this.state.participants.length}</p>
            <p>active: {this.localStream.active ? "YES" : "NO"}</p>
            <ul></ul>
          </div>
        )}

        <Footer
          localStream={this.localStream}
          currentUser={this.state.currentUser}
          onToggleCamera={() => this.onToggleCamera()}
          onLeave={() => this.onLeave()}
        />
      </section>
    );
  }
}

export default Channel;
