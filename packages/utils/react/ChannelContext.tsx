import React, { createContext, useState, useEffect } from "react";
import { PostType } from "../types";

type State = {
  communityId: string;
  channelId: string;
  entries: {
    [PostType];
  };
};

type ContextProps = {
  state: State;
  methods: {};
};

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
  },
  methods: {},
};

const AgentContext = createContext(initialState);

export function AgentProvider({ channelId, communityId, children }: any) {
  const [state, setState] = useState(initialState.state);

  useEffect(() => {
    fetchAgent();
  }, []);

  async function fetchAgent() {
    const agent = await getMe();

    setState({ ...state, ...agent });
  }

  return (
    <AgentContext.Provider
      value={{
        state,
        methods: {},
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export default AgentContext;
