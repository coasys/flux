import React, { createContext } from "react";

export type State = {
  communityId: string;
  channelId: string;
};

export interface ContextProps {
  state: State;
  methods: {};
}

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
  },
  methods: {},
};

const ChannelContext = createContext(initialState as ContextProps);

export function ChannelProvider({ channelId, communityId, children }: any) {
  return (
    <ChannelContext.Provider
      value={{
        state: { channelId, communityId },
        methods: {},
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export default ChannelContext;
