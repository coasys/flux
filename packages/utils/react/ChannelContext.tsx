import React, { createContext, useState } from "react";
import { EntryType, Post } from "../types";

type State = {
  communityId: string;
  channelId: string;
  posts: {
    [x: EntryType]: {
      [x: string]: Post;
    };
  };
};

type ContextProps = {
  state: State;
  methods: {
    loadPost: (id: string, type: EntryType) => void;
    loadPosts: (type: EntryType) => void;
  };
};

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
    posts: {},
  },
  methods: {
    loadPost: () => null,
    loadPosts: () => null,
  },
};

const ChannelContext = createContext(initialState);

export function ChannelProvider({ channelId, communityId, children }: any) {
  const [state, setState] = useState(initialState.state);

  function loadPosts() {}

  return (
    <ChannelContext.Provider
      value={{
        state: { ...state, channelId, communityId },
        methods: {},
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export default ChannelContext;
