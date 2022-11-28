import React, { createContext, useState, useEffect } from "react";
import { EntryType, Post } from "../types";
import getPosts from "../api/getPosts";
import PostModel from "../api/post";

export type State = {
  communityId: string;
  channelId: string;
  keyedPosts: {
    [x: string]: Post;
  };
};

export interface ContextProps {
  state: State;
  methods: {
    loadPost: (id: string) => void;
    loadPosts: (types: EntryType[], fromDate?: Date) => void;
  };
}

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
    keyedPosts: {},
  },
  methods: {
    loadPost: () => null,
    loadPosts: () => null,
  },
};

const ChannelContext = createContext(initialState as ContextProps);

export function ChannelProvider({ channelId, communityId, children }: any) {
  const [state, setState] = useState<State>(initialState.state);

  useEffect(() => {
    if (communityId && channelId) {
      const Post = new PostModel({
        perspectiveUuid: communityId,
        source: channelId,
        type: EntryType.SimplePost,
      });

      Post.onAdded(EntryType.SimplePost, (post) => {
        console.log({ post });
      });
    }
  }, [communityId, channelId]);

  const posts = sortPosts(state.keyedPosts);

  function loadPosts(types: EntryType[], fromDate?: Date) {
    getPosts(communityId, channelId, fromDate).then((posts) => {
      setState((oldState) => addPosts(oldState, posts));
    });
  }

  return (
    <ChannelContext.Provider
      value={{
        state: { ...state, channelId, communityId, posts },
        methods: {
          loadPosts,
        },
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

function sortPosts(keyedPosts: { [x: string]: Post }) {
  return Object.values(keyedPosts)
    .map((i: Post) => i)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function toKeyedObject(array: any[], key: string) {
  return array.reduce((acc, item) => {
    return {
      ...acc,
      [item[key]]: item,
    };
  }, {});
}

function addPosts(oldState, posts) {
  return {
    ...oldState,
    keyedPosts: { ...oldState.keyedPosts, ...toKeyedObject(posts, "id") },
  };
}

export default ChannelContext;
