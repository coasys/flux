import { useState } from "preact/hooks";
import { createContext } from "preact";

export enum View {
  Feed = "FEED",
  Post = "POST",
}

type State = {
  view: View;
  currentPost: string;
};

type ContextProps = {
  state: State;
  methods: {
    goToPost: (id: string) => void;
    goToFeed: () => void;
  };
};

const initialState: ContextProps = {
  state: {
    view: View.Feed,
    currentPost: null,
  },
  methods: {
    goToPost: (id: string) => null,
    goToFeed: () => null,
  },
};

const UIContext = createContext(initialState);

export function UIProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

  function goToPost(id: string) {
    setState({ ...state, view: View.Post, currentPost: id });
  }

  function goToFeed() {
    setState({ ...state, view: View.Feed, currentPost: null });
  }

  return (
    <UIContext.Provider
      value={{
        state,
        methods: {
          goToFeed,
          goToPost,
        },
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export default UIContext;
