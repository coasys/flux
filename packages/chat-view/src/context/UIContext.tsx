import { useState } from "preact/hooks";
import { createContext } from "preact";

type State = {
  currentReply: string;
  currentMessageEdit: string;
};

type ContextProps = {
  state: State;
  methods: {
    setCurrentReply: (id: string) => void;
    setCurrentEditMessage: (id: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    currentReply: "",
    currentMessageEdit: null
  },
  methods: {
    setCurrentReply: (id: string) => null,
    setCurrentEditMessage: (id: string) => null,
  },
};

const UIContext = createContext(initialState);

export function UIProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

  return (
    <UIContext.Provider
      value={{
        state,
        methods: {
          setCurrentReply(id: string) {
            setState({ ...state, currentReply: id });
          },
          setCurrentEditMessage(id: string) {
            setState({ ...state, currentMessageEdit: id });
          },
        },
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export default UIContext;
