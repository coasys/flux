import React, { createContext, useState, useEffect, useMemo } from "react";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import getPerspectiveProfile from "../api/getProfile";
import useEntries from "./useEntries";
import useEntry from "./useEntry";
import ChannelModel from "../api/channel";
import MemberModel from "../api/member";
import CommunityModel from "../api/community";
import { SELF } from "../constants/communityPredicates";
import getProfile from "../api/getProfile";

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

const PerspectiveContext = createContext<ContextProps>(initialState);

export function PerspectiveProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState({
    ...initialState.state,
  });

  const { entry: community } = useEntry({
    perspectiveUuid,
    model: CommunityModel,
    id: SELF,
  });

  const { entries: channelEntries } = useEntries({
    perspectiveUuid,
    model: ChannelModel,
  });

  const { entries: memberEntries } = useEntries({
    perspectiveUuid,
    model: MemberModel,
  });

  useEffect(() => {
    fetchProfiles();
  }, [memberEntries.length]);

  async function fetchProfiles() {
    const profilePromises = memberEntries
      .filter((member) => !state.members[member.did])
      .map((member) => getProfile(member.did));

    const newProfiles = await Promise.all(profilePromises);

    setState((oldState) => {
      const members = newProfiles.reduce((acc, profile) => {
        return { ...acc, [profile.did]: profile };
      }, oldState.members);

      return { ...oldState, members };
    });
  }

  const channels = useMemo(() => {
    return channelEntries.reduce((acc, channel) => {
      return { ...acc, [channel.id]: channel };
    }, {});
  }, [channelEntries]);

  return (
    <PerspectiveContext.Provider
      value={{
        state: {
          ...state,
          uuid: perspectiveUuid,
          name: community?.name || "",
          description: community?.description || "",
          image: community?.image || "",
          thumbnail: community?.thumbnail || "",
          channels,
        },
      }}
    >
      {children}
    </PerspectiveContext.Provider>
  );
}

export default PerspectiveContext;
