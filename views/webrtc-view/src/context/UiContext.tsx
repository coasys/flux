import { useState } from "preact/hooks";
import { createContext } from "preact";

export type Notification = {
  id: string;
  type: "connect" | "join" | "leave";
  userId: string;
};

type State = {
  settings: {
    sounds: boolean;
  };
  notifications: Notification[];
};

type ContextProps = {
  state: State;
  methods: {
    addNotification: (Notification: Notification) => void;
  };
};

const initialState: ContextProps = {
  state: {
    notifications: [],
    settings: {
      sounds: true,
    },
  },
  methods: {
    addNotification: () => null,
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
        },
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export default UiContext;
