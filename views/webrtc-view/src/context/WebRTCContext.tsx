import { useState } from "preact/hooks";
import { createContext } from "preact";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";

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

type State = {
  currentUser: StreamUser;
  localStream: MediaStream | null;
  participants: StreamUser[];
};

type ContextProps = {
  state: State;
  methods: {
    setLocalStream: (stream: MediaStream) => void;
    setUser: (user: StreamUser) => void;
    setUserPrefrences: (prefrences: StreamUserPrefrences) => void;
    addParticipant: (user: StreamUser) => void;
    removeParticipant: (user: StreamUser) => void;
    updateParticipant: (user: StreamUser) => void;
    addIceCandidate: (candidate: RTCIceCandidateInit) => void;
    addOffer: (offer: RTCLocalSessionDescriptionInit, senderId: string) => void;
    addAnswer: (answer: RTCLocalSessionDescriptionInit) => void;
    leave: () => void;
  };
};

const initialState: ContextProps = {
  state: {
    currentUser: null,
    localStream: null,
    participants: [],
  },
  methods: {
    setLocalStream: (stream: MediaStream) => null,
    setUser: (user: StreamUser) => null,
    setUserPrefrences: (prefrences: StreamUserPrefrences) => null,
    addParticipant: (user: StreamUser) => null,
    removeParticipant: (user: StreamUser) => null,
    updateParticipant: (user: StreamUser) => null,
    addIceCandidate: (candidate: RTCIceCandidateInit) => null,
    addOffer: (offer: RTCLocalSessionDescriptionInit, senderId: string) => null,
    addAnswer: (answer: RTCLocalSessionDescriptionInit) => null,
    leave: () => null,
  },
};

const WebRTCContext = createContext(initialState);

export function WebRTCProvider({ children, uuid, source }: any) {
  const [state, setState] = useState(initialState.state);

  const announceMyArrival = async () => {
    console.log("announceJoin");

    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);

    perspective.add({
      source,
      predicate: "join",
      target: source,
    });
  };

  const announceMyDeparture = async () => {
    console.log("announceDeparture");

    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);

    // perspective.remove({
    //   source,
    //   predicate: "leave",
    //   target: source,
    // });
  };

  const sendCandidateToParticipant = async (
    receiverId: string,
    createdById: string,
    candidate: RTCIceCandidate
  ) => {
    console.log("sendCandidateToParticipant");

    const offerCandidateData = {
      ...candidate.toJSON(),
      receiverId,
      userId: createdById,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);

    perspective.add({
      source,
      predicate: "candidate",
      target: JSON.stringify(offerCandidateData),
    });
  };

  const sendAnswerCandidateToParticipant = async (
    receiverId: string,
    createdById: string,
    candidate: RTCIceCandidate
  ) => {
    console.log("sendAnswerCandidateToParticipant");

    const answerCandidateData = {
      ...candidate.toJSON(),
      receiverId,
      userId: createdById,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);

    perspective.add({
      source,
      predicate: "answer-candidate",
      target: JSON.stringify(answerCandidateData),
    });
  };

  const sendOfferToParticipant = async (
    receiverId: string,
    createdById: string,
    offer: RTCLocalSessionDescriptionInit
  ) => {
    console.log("sendOfferToParticipant");

    const offerData = {
      receiverId,
      userId: createdById,
      offer,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);

    perspective.add({
      source,
      predicate: "offer",
      target: JSON.stringify(offerData),
    });
  };

  const sendAnswerToCandidate = async (
    receiverId: string,
    createdById: string,
    answer: RTCLocalSessionDescriptionInit
  ) => {
    console.log("sendAnswerToCandidate");

    const answerData = {
      receiverId,
      userId: createdById,
      answer,
    };
    const client: Ad4mClient = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);

    perspective.add({
      source,
      predicate: "answer",
      target: JSON.stringify(answerData),
    });
  };

  const createOffer = async (
    peerConnection: RTCPeerConnection,
    receiverId: string,
    createdID: string
  ) => {
    // Send offer candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendCandidateToParticipant(receiverId, createdID, event.candidate);
      }
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Send offer
    await sendOfferToParticipant(receiverId, createdID, offer);
  };

  const createAnswer = async (
    peerConnection: RTCPeerConnection,
    createdID: string,
    receiverId: string
  ) => {
    // Send answer candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendAnswerCandidateToParticipant(
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
    await sendAnswerToCandidate(receiverId, createdID, answer);
  };

  const addConnectionToUser = (
    newUser: StreamUser,
    currentUser: StreamUser,
    stream: MediaStream
  ) => {
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
      createOffer(newPeerConnection, offerIds[0], offerIds[1]);
    }

    return newUser;
  };

  return (
    <WebRTCContext.Provider
      value={{
        state,
        methods: {
          setLocalStream(stream: MediaStream) {
            setState((oldState) => ({ ...oldState, localStream: stream }));
          },
          setUser(user: StreamUser) {
            announceMyArrival();
            setState((oldState) => ({ ...oldState, currentUser: user }));
          },
          setUserPrefrences(prefrences: StreamUserPrefrences) {
            setState((oldState) => ({
              ...oldState,
              currentUser: { ...oldState.currentUser, prefrences },
            }));
          },
          addParticipant(user: StreamUser) {
            setState((oldState) => {
              const alreadyJoined = oldState.participants.find(
                (p) => p.did === user.did
              );

              if (alreadyJoined) {
                console.info("User already joined, aborting");
                return oldState;
              }

              const newUserWithConnection = addConnectionToUser(
                user,
                oldState.currentUser,
                oldState.localStream
              );
              const isCurrentUser = user.did === oldState.currentUser.did;

              return {
                ...oldState,
                participants: [
                  ...oldState.participants,
                  { ...newUserWithConnection, isCurrentUser },
                ],
              };
            });
          },
          removeParticipant(user: StreamUser) {
            setState((oldState) => ({
              ...oldState,
              participants: [
                ...oldState.participants.filter((p) => p.did !== user.did),
              ],
            }));
          },
          updateParticipant(user: StreamUser) {
            setState((oldState) => ({
              ...oldState,
              participants: [
                ...oldState.participants.filter((p) => p.did !== user.did),
                user,
              ],
            }));
          },
          addIceCandidate(candidate: RTCIceCandidateInit) {
            setState((oldState) => {
              const myPeerConnection = oldState.participants.find(
                (p) => p.did === oldState.currentUser.did
              )?.peerConnection;
              myPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));

              return oldState;
            });
          },
          addOffer(offer: RTCLocalSessionDescriptionInit, senderId: string) {
            setState((oldState) => {
              const myPeerConnection = oldState.participants.find(
                (p) => p.did === oldState.currentUser.did
              )?.peerConnection;
              const otherUserPeerConnection = oldState.participants.find(
                (p) => p.did === senderId
              )?.peerConnection;

              // Add offer to my connection
              myPeerConnection.setRemoteDescription(
                new RTCSessionDescription(offer as RTCSessionDescriptionInit)
              );

              createAnswer(
                otherUserPeerConnection,
                oldState.currentUser.did,
                senderId
              );

              return oldState;
            });
          },
          addAnswer(answer: RTCLocalSessionDescriptionInit) {
            setState((oldState) => {
              const myPeerConnection = oldState.participants.find(
                (p) => p.did === oldState.currentUser.did
              )?.peerConnection;

              console.log("adding answer: ", answer);
              console.log("myPeerConnection: ", myPeerConnection);

              // Add answer to my connection
              myPeerConnection.setRemoteDescription(
                new RTCSessionDescription(answer as RTCSessionDescriptionInit)
              );

              return oldState;
            });
          },
          leave() {
            announceMyDeparture();
          },
        },
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}

export default WebRTCContext;
