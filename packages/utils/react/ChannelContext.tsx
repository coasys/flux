import React, { createContext, useState, useEffect } from "react";
import { EntryType } from "../types";

type State = {
  communityId: string;
  channelId: string;
  entries: {
    [x: EntryType]: {
      [x: string]: any;
    };
  };
};

type ContextProps = {
  state: State;
  methods: {
    getEntry: (id: string, type: EntryType) => void;
    loadEntries: (type: EntryType) => void;
  };
};

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
    entries: {},
  },
  methods: {
    getEntry: () => null,
    loadEntries: () => null,
  },
};

const AgentContext = createContext(initialState);

export function AgentProvider({ channelId, communityId, children }: any) {
  const [state, setState] = useState(initialState.state);

  return (
    <AgentContext.Provider
      value={{
        state,
        methods: {
          loadEntries,
        },
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export default AgentContext;
