import { useMemo, useRef, useState } from "preact/hooks";
import { createContext } from "preact";
import { Howl } from "howler";
import joinMp3 from "../assets/join.mp3";
import leaveMp3 from "../assets/leave.mp3";

export type Notification = {
  id: string;
  type: "connect" | "join" | "leave";
  userId: string;
};

type State = {
  showSettings: boolean;
  showDebug: boolean;
  notifications: Notification[];
  settings: {
    muteSounds: boolean;
  };
};

type ContextProps = {
  state: State;
  methods: {
    addNotification: (Notification: Notification) => void;
    toggleShowSettings: (visible: boolean) => void;
    toggleShowDebug: (visible: boolean) => void;
  };
};

const joinSound = new Howl({
  src: [joinMp3],
  volume: 0.5,
});
const leaveSound = new Howl({
  src: [leaveMp3],
  volume: 0.5,
});

const initialState: ContextProps = {
  state: {
    showSettings: false,
    showDebug: false,
    notifications: [],
    settings: {
      muteSounds: true,
    },
  },
  methods: {
    addNotification: () => null,
    toggleShowSettings: () => null,
    toggleShowDebug: () => null,
  },
};

const UiContext = createContext(initialState);

export function UiProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);
  const soundPlaying = useRef(false);

  const checkAndPlaySound = useMemo(
    () => (notification: Notification) => {
      if (soundPlaying.current === true) {
        return;
      }

      if (notification.type === "join") {
        soundPlaying.current = true;
        joinSound.play();
      }
      if (notification.type === "leave") {
        soundPlaying.current = true;
        leaveSound.play();
      }
    },
    [soundPlaying]
  );

  return (
    <UiContext.Provider
      value={{
        state,
        methods: {
          addNotification(notification: Notification) {
            checkAndPlaySound(notification);

            const id = String(Date.now());
            setState((oldState) => ({
              ...oldState,
              notifications: [
                ...oldState.notifications,
                { id, ...notification },
              ],
            }));
            setTimeout(() => {
              soundPlaying.current = false;
              setState((oldState) => ({
                ...oldState,
                notifications: oldState.notifications.filter(
                  (n) => n.id !== id
                ),
              }));
            }, 3000);
          },
          toggleShowSettings(visible: boolean) {
            setState((oldState) => ({
              ...oldState,
              showSettings: visible,
            }));
          },
          toggleShowDebug(visible: boolean) {
            setState((oldState) => ({
              ...oldState,
              showSettings: false,
              showDebug: visible,
            }));
          },
        },
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export default UiContext;
