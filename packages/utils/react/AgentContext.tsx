import React, { createContext, useState, useEffect, useContext } from "react";
import getMe from "../api/getMe";

type State = {
  did: string;
  isInitialized: boolean;
  isUnlocked: boolean;
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
  },
  methods: {},
};

const AgentContext = createContext(initialState);

export function AgentProvider({ children }: any) {
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
