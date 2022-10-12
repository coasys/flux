import { useState } from "preact/hooks";
import { createContext } from "preact";

type State = {
  currentReply: string;
};

type ContextProps = {
  state: State;
  methods: {
    setCurrentReply: (id: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    currentReply: "",
  },
  methods: {
    setCurrentReply: (id: string) => null,
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
        },
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export default UIContext;
