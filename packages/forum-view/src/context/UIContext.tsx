import { useState } from "preact/hooks";
import { createContext } from "preact";
import { PostOption } from "../constants/options";

export enum View {
  Feed = "FEED",
  Post = "POST",
}

type State = {
  view: View;
  currentPost: string;
  initialPostType: PostOption;
  showOverlay: boolean;
};

type ContextProps = {
  state: State;
  methods: {
    goToPost: (id: string) => void;
    goToFeed: () => void;
    toggleOverlay: (visible: boolean, postType?: PostOption) => void;
  };
};

const initialState: ContextProps = {
  state: {
    view: View.Feed,
    currentPost: null,
    initialPostType: PostOption.Text,
    showOverlay: false,
  },
  methods: {
    goToPost: (id: string) => null,
    goToFeed: () => null,
    toggleOverlay: (visible: boolean, postType?: PostOption) => null,
  },
};

const UIContext = createContext(initialState);

export function UIProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

  function goToPost(id: string) {
    setState({ ...state, view: View.Post, currentPost: id, showOverlay: null });
  }

  function goToFeed() {
    setState({ ...state, view: View.Feed, currentPost: null });
  }

  function toggleOverlay(visible: boolean, postType?: PostOption) {
    setState({
      ...state,
      initialPostType: postType || PostOption.Text,
      showOverlay: visible,
    });
  }

  return (
    <UIContext.Provider
      value={{
        state,
        methods: {
          goToFeed,
          goToPost,
          toggleOverlay,
        },
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export default UIContext;
