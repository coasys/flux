import React, { createContext, useState, useEffect } from "react";
import { useEntries } from "./useEntries";
import { useEntry } from "./useEntry";
import {
  Channel as ChannelModel,
  Community as CommunityModel,
  getProfile,
} from "@fluxapp/api";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

type State = {
  uuid: string;
  name: string;
  description: string;
  image: string;
  thumbnail: string;
  members: { [x: string]: any };
  channels: { [x: string]: any };
};

type ContextProps = {
  state: State;
};

const initialState: ContextProps = {
  state: {
    uuid: "",
    name: "",
    image: "",
    thumbnail: "",
    description: "",
    members: {},
    channels: {},
  },
};

const CommunityContext = createContext<ContextProps>(initialState);

type ProviderProps = {
  perspective: PerspectiveProxy;
  children: any;
};

export function CommunityProvider({ perspective, children }: ProviderProps) {
  const [state, setState] = useState({
    ...initialState.state,
  });

  const { entry: community } = useEntry({
    perspective,
    model: CommunityModel,
  });

  const { entries: channelEntries } = useEntries({
    perspective,
    model: ChannelModel,
    source: community?.id || null,
  });

  useEffect(() => {
    fetchProfiles();
    fetchChannels();
  }, [channelEntries.length]);

  async function fetchProfiles() {
    const neighbourhood = perspective.getNeighbourhoodProxy();
    const others = await neighbourhood.otherAgents();

    const profilePromises = others.map(async (did) => getProfile(did));

    const newProfiles = await Promise.all(profilePromises);

    setState((oldState) => {
      const members = newProfiles.reduce((acc, profile) => {
        return { ...acc, [profile.did]: profile };
      }, oldState.members);

      return { ...oldState, members };
    });
  }

  async function fetchChannels() {
    const channels = channelEntries.reduce(
      (acc, channel) => ({
        ...acc,
        [channel.id]: channel,
      }),
      {}
    );

    setState((oldState) => ({
      ...oldState,
      channels,
    }));
  }

  return (
    <CommunityContext.Provider
      value={{
        state: {
          ...state,
          uuid: perspective.uuid,
          name: community?.name || "",
          description: community?.description || "",
          image: community?.image || "",
          thumbnail: community?.thumbnail || "",
        },
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export default CommunityContext;
