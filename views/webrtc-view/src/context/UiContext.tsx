import { useState } from "preact/hooks";
import { createContext } from "preact";

export type Notification = {
  type: "connect" | "join" | "leave";
  userId: string;
};

type State = {
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
            setState((oldState) => ({
              ...oldState,
              notifications: [...oldState.notifications, notification],
            }));
            // setTimeout(() => {
            //   this.setState({ success: false });
            // }, 3000);
          },
        },
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export default UiContext;
