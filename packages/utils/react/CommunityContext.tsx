import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import getMembers from "../api/getMembers";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import subscribeToLinks from "../api/subscribeToLinks";
import { linkIs } from "../helpers/linkHelpers";
import getPerspectiveProfile from "../api/getProfile";
import ChannelModel from "utils/api/channel";
import useEntries from "./useEntries";

type State = {
  uuid: string;
  name: string;
  description: string;
  languages: Array<any>;
  url: string;
  sourceUrl: string;
  members: { [x: string]: any };
  channels: { [x: string]: any };
};

type ContextProps = {
  state: State;
  methods: {
    getProfile: (did: string) => any;
  };
};

const initialState: ContextProps = {
  state: {
    uuid: "",
    name: "",
    description: "",
    url: "",
    sourceUrl: "",
    languages: [],
    members: {},
    channels: {},
  },
  methods: {
    getProfile: (did: string) => null,
  },
};

const CommunityContext = createContext<ContextProps>(initialState);

export function CommunityProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState(initialState.state);
  const linkSubscriberRef = useRef();

  const { entries } = useEntries({
    perspectiveUuid,
    model: ChannelModel,
  });

  const channels = useMemo(() => {
    return entries.reduce((acc, channel) => {
      return { ...acc, [channel.id]: channel };
    }, {});
  }, [entries]);

  useEffect(() => {
    if (perspectiveUuid) {
      fetchMeta();
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current?.removeListener("link-added", handleLinkAdded);
    };
  }, [perspectiveUuid]);

  useEffect(() => {
    fetchMembers();
  }, [state.url, state.sourceUrl]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid: perspectiveUuid,
      added: handleLinkAdded,
    });
  }

  async function handleLinkAdded(link) {
    if (linkIs.member(link)) {
      const profile = await getProfile(link.data.target);
      setState((prev) => ({
        ...prev,
        members: { ...prev.members, [profile.did]: profile },
      }));
    }
  }

  const fetchMembers = async () => {
    if (state.url) {
      const members = await getMembers({
        perspectiveUuid: perspectiveUuid,
      });

      const keyedMembers = members.reduce((acc, member) => {
        return {
          ...acc,
          [member.did]: member,
        };
      }, {});

      setState((prev) => ({
        ...prev,
        members: keyedMembers,
      }));
    }
  };

  async function fetchMeta() {
    const meta = await getPerspectiveMeta(perspectiveUuid);
    setState({
      ...state,
      name: meta.name,
      description: meta.description,
      url: meta.url,
      sourceUrl: meta.sourceUrl,
      members: {},
      channels: {},
    });
  }

  async function getProfile(url: string) {
    const did = url.split("://").length > 1 ? url.split("://")[1] : url;

    if (state.members[did]) {
      return state.members[did];
    } else {
      const profile = await getPerspectiveProfile(url);

      if (profile) {
        setState((oldState) => ({
          ...oldState,
          members: { ...oldState.members, [profile.did]: profile },
        }));

        return profile;
      } else {
        return null;
      }
    }
  }

  return (
    <CommunityContext.Provider
      value={{
        state: { ...state, channels, uuid: perspectiveUuid },
        methods: {
          getProfile,
        },
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export default CommunityContext;
