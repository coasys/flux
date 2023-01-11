import { useState } from "preact/hooks";
import { createContext } from "preact";
import { PostOption } from "../constants/options";
import * as localstorage from "utils/helpers/localStorage";

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

const initialCurrentPost = localstorage.get("currentPost");

const initialState: ContextProps = {
  state: {
    view: initialCurrentPost ? View.Post : View.Feed,
    currentPost: initialCurrentPost || null,
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
    localstorage.set("currentPost", id);
    setState({ ...state, view: View.Post, currentPost: id, showOverlay: null });
  }

  function goToFeed() {
    localstorage.remove("currentPost");
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
