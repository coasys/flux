import React, { createContext, useState, useEffect } from 'react';
import { Ad4mClient } from "@perspect3vism/ad4m"
import { buildAd4mClient } from '../api/client';

type State = {
  client?: Ad4mClient;
  state: 'not_connected' | 'connecting' | 'connected' | 'failed';
}

type ContextProps = {
  state: State;
}

const initialState: ContextProps = {
  state: {
    client: undefined,
    state: 'not_connected'
  }
}

export const Ad4mContext = createContext(initialState);

export function Ad4mProvider({ children, port }: any) {
  const [state, setState] = useState(initialState.state);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      state: 'connecting'
    }))

    if (port) {
      const client = buildAd4mClient(port);

      client.agent.status().then(e => {
        setState((prev) => ({
          ...prev,
          client,
          state: 'connected'
        }))
      }).catch(() => {
        setState((prev) => ({
          ...prev,
          state: 'failed'
        }))
      })
    }
  }, [port])

  return (
    <Ad4mContext.Provider
      value={{
        state
      }}
    >
      {children}
    </Ad4mContext.Provider>
  )
}