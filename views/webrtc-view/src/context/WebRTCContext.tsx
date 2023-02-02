import { useState } from "preact/hooks";
import { createContext } from "preact";

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
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

type Offer = {
  sdp: string;
  type: RTCSdpType;
  userId: string;
};

type OfferCandidate = {
  userId: string;
};

type StreamUser = {
  did: string;
  currentUser?: boolean;
  candidate?: string;
  peerConnection?: RTCPeerConnection;
  offerCandidates?: OfferCandidate[];
  offers?: Offer[];
  prefrences?: StreamUserPrefrences;
};

type State = {
  currentUser: StreamUser;
  stream: MediaStream | null;
  participants: StreamUser[];
};

type ContextProps = {
  state: State;
  methods: {
    setStream: (stream: MediaStream) => void;
    setUser: (user: StreamUser) => void;
    setUserPrefrences: (prefrences: StreamUserPrefrences) => void;
    addParticipant: (user: StreamUser) => void;
    removeParticipant: (user: StreamUser) => void;
    updateParticipant: (user: StreamUser) => void;
  };
};

const initialState: ContextProps = {
  state: {
    currentUser: null,
    stream: null,
    participants: [],
  },
  methods: {
    setStream: (stream: MediaStream) => null,
    setUser: (user: StreamUser) => null,
    setUserPrefrences: (prefrences: StreamUserPrefrences) => null,
    addParticipant: (user: StreamUser) => null,
    removeParticipant: (user: StreamUser) => null,
    updateParticipant: (user: StreamUser) => null,
  },
};

const WebRTCContext = createContext(initialState);

export function WebRTCProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

  const addCandidateToParticipant = (
    participantId: string,
    createdById: string,
    candidate: RTCIceCandidate
  ) => {
    const userObject = state.participants.find((p) => p.did === participantId);

    setState((oldState) => ({
      ...oldState,
      participants: [
        ...oldState.participants.filter((p) => p.did !== userObject.did),
        {
          ...userObject,
          offerCandidates: [
            ...userObject.offerCandidates,
            { ...candidate.toJSON(), userId: createdById },
          ],
        },
      ],
    }));
  };

  const addOfferToParticipant = (participantId: string, offer: Offer) => {
    const userObject = state.participants.find((p) => p.did === participantId);

    setState((oldState) => ({
      ...oldState,
      participants: [
        ...oldState.participants.filter((p) => p.did !== userObject.did),
        {
          ...userObject,
          offers: [...userObject.offers, offer],
        },
      ],
    }));
  };

  const createOffer = async (
    peerConnection: RTCPeerConnection,
    receiverId: string,
    createdID: string
  ) => {
    // Add offer candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addCandidateToParticipant(receiverId, createdID, event.candidate);
      }
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
      userId: createdID,
    };

    // Add offer
    addOfferToParticipant(receiverId, offer);
  };

  const addConnection = (
    newUser: StreamUser,
    currentUser: StreamUser,
    stream: MediaStream
  ) => {
    const peerConnection = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    const newUserId = newUser.did;
    const currentUserId = currentUser.did;

    const offerIds = [newUserId, currentUserId].sort((a, b) =>
      a.localeCompare(b)
    );

    newUser.peerConnection = peerConnection;
    if (offerIds[0] !== currentUserId) {
      createOffer(peerConnection, offerIds[0], offerIds[1]);
    }

    return newUser;
  };

  return (
    <WebRTCContext.Provider
      value={{
        state,
        methods: {
          setStream(stream: MediaStream) {
            setState((oldState) => ({ ...oldState, stream }));
          },
          setUser(user: StreamUser) {
            setState((oldState) => ({ ...oldState, currentUser: user }));
          },
          setUserPrefrences(prefrences: StreamUserPrefrences) {
            setState((oldState) => ({
              ...oldState,
              currentUser: { ...oldState.currentUser, prefrences },
            }));
          },
          addParticipant(user: StreamUser) {
            addConnection(user, state.currentUser, state.stream);
            const isCurrentUser = user.did === state.currentUser.did;

            setState((oldState) => ({
              ...oldState,
              participants: [
                ...oldState.participants,
                { ...user, isCurrentUser },
              ],
            }));
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
        },
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}

export default WebRTCContext;
