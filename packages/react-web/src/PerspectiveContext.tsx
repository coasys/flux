import React, { createContext, useState, useEffect } from "react";
import { getMe, getProfile } from "@fluxapp/api";
import { Profile } from "@fluxapp/types";

type State = {
  perspective:
  agent:
  source:
};

type ContextProps = {
  state: State;
  methods: {};
};

const initialState: ContextProps = {
  state: {
    did: "",
    isInitialized: false,
    isUnlocked: false,
    profile: null,
  },
  methods: {},
};

const AgentContext = createContext(initialState);

export function AgentProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

  useEffect(() => {
    fetchAgent();
  }, []);

  useEffect(() => {
    if (state.did) {
      getProfile(state.did).then((profile) => setState({ ...state, profile }));
    }
  }, [state.did]);

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
