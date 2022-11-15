import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import getMembers from "../api/getMembers";
import getChannels from "../api/getChannels";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import subscribeToLinks from "../api/subscribeToLinks";
import { linkIs } from "../helpers/linkHelpers";
import getPerspectiveProfile from "../api/getProfile";
import { Literal } from "@perspect3vism/ad4m";

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

const PerspectiveContext = createContext<ContextProps>(initialState);

export function PerspectiveProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState(initialState.state);
  const linkSubscriberRef = useRef();

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
    fetchChannels();
    fetchMembers();
  }, [state.url, state.sourceUrl]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid: perspectiveUuid,
      added: handleLinkAdded,
    });
  }

  async function handleLinkAdded(link) {
    if (linkIs.channel(link)) {
      const literal = Literal.fromUrl(link.data.target).get();
      const channelObj = {
        name: literal.data,
        description: "",
        id: link.data.target,
      };

      setState((oldState) => {
        const isAlreadyPartOf = Object.values(oldState.channels).find(
          (c: any) => c.name === link.data.target
        );

        if (isAlreadyPartOf) {
          return oldState;
        }

        return {
          ...oldState,
          channels: {
            ...oldState.channels,
            [channelObj.id]: channelObj,
          },
        };
      });
    }

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

  const fetchChannels = async () => {
    if (state.url) {
      const channels = await getChannels({
        perspectiveUuid: perspectiveUuid,
      });
      setState((prev, curr) => ({ ...prev, channels }));
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
    <PerspectiveContext.Provider
      value={{
        state: { ...state, uuid: perspectiveUuid },
        methods: {
          getProfile,
        },
      }}
    >
      {children}
    </PerspectiveContext.Provider>
  );
}

export default PerspectiveContext;
