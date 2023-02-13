import React, { createContext, useState, useEffect, useMemo } from "react";
import useEntries from "./useEntries";
import useEntry from "./useEntry";
import ChannelModel from "../api/channel";
import MemberModel from "../api/member";
import CommunityModel from "../api/community";
import { getProfile } from "../api";
import { EntryType } from "../types";
import { asyncFilter } from "../helpers";

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

export function CommunityProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState({
    ...initialState.state,
  });

  const { entry: community } = useEntry({
    perspectiveUuid,
    model: CommunityModel,
  });

  const { entries: channelEntries } = useEntries({
    perspectiveUuid,
    model: ChannelModel,
    source: community?.id || null
  });

  const { entries: memberEntries } = useEntries({
    perspectiveUuid,
    model: MemberModel,
  });

  useEffect(() => {
    fetchProfiles();
    fetchChannels();
  }, [memberEntries.length, channelEntries.length]);

  async function fetchProfiles() {
    const filteredProfiles = await asyncFilter(memberEntries, async (member: any) => {
      const type = await member.type;
      const did = await member.did;
      return type === EntryType.Member && (did !== undefined && !state.members[did])
    });

    const profilePromises = filteredProfiles
      .map(async (member) => getProfile(await member.did));

    const newProfiles = await Promise.all(profilePromises);

    setState((oldState) => {
      const members = newProfiles.reduce((acc, profile) => {
        return { ...acc, [profile.did]: profile };
      }, oldState.members);

      return { ...oldState, members };
    });
  }

  async function fetchChannels() {
    const channels = channelEntries.reduce((acc, channel) => ({
      ...acc,
      [channel.id]: channel
    }), {})

    setState((oldState) => ({
      ...oldState,
      channels,
    }))
  } 


  return (
    <CommunityContext.Provider
      value={{
        state: {
          ...state,
          uuid: perspectiveUuid,
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
