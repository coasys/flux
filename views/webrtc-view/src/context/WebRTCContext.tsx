import { useState } from "preact/hooks";
import { createContext } from "preact";

type StreamUser = {
  id: string;
  name: string;
  candidate: string;
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
    addParticipant: (user: StreamUser) => null,
    removeParticipant: (user: StreamUser) => null,
    updateParticipant: (user: StreamUser) => null,
  },
};

const WebRTCContext = createContext(initialState);

export function WebRTCProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

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
          addParticipant(user: StreamUser) {
            setState((oldState) => ({
              ...oldState,
              participants: [...oldState.participants, user],
            }));
          },
          removeParticipant(user: StreamUser) {
            setState((oldState) => ({
              ...oldState,
              participants: [
                ...oldState.participants.filter((p) => p.id !== user.id),
              ],
            }));
          },
          updateParticipant(user: StreamUser) {
            setState((oldState) => ({
              ...oldState,
              participants: [
                ...oldState.participants.filter((p) => p.id !== user.id),
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
