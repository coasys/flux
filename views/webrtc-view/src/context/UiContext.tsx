import { useState } from "preact/hooks";
import { createContext } from "preact";

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

  return (
    <UiContext.Provider
      value={{
        state,
        methods: {
          addNotification(notification: Notification) {
            const id = String(Date.now());
            setState((oldState) => ({
              ...oldState,
              notifications: [
                ...oldState.notifications,
                { id, ...notification },
              ],
            }));
            setTimeout(() => {
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
