import { useState, useCallback, useEffect, useMemo } from "react";
import { getCache, setCache, subscribe, unsubscribe } from "./cache";
import { Agent, AgentStatus } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { mapLiteralLinks } from "@coasys/flux-utils";
import { profile as profileConstants } from "@coasys/flux-constants";
import { Profile } from "@coasys/flux-types";

const {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profileConstants;

type MeData = {
  agent?: Agent;
  status?: AgentStatus;
};

type MyInfo = {
  me?: Agent;
  status?: AgentStatus;
  profile: Profile | null;
  error: string | undefined;
  mutate: Function;
  reload: Function;
};

export function useMe(agent: AgentClient | undefined): MyInfo {
  const forceUpdate = useForceUpdate();
  const [error, setError] = useState<string | undefined>(undefined);

  // Create cache key for entry
  const cacheKey = `agents/me`;

  // Mutate shared/cached data for all subscribers
  const mutate = useCallback(
    (data: MeData | null) => setCache(cacheKey, data),
    [cacheKey]
  );

  // Fetch data from AD4M and save to cache
  const getData = useCallback(() => {
    if (!agent) {
      return;
    }

    const promises = Promise.all([agent.status(), agent.me()]);

    promises
      .then(async ([status, agent]) => {
        setError(undefined);
        mutate({ agent, status });
      })
      .catch((error) => setError(error.toString()));
  }, [agent, mutate]);

  // Trigger initial fetch
  useEffect(getData, [getData]);

  // Subscribe to changes (re-render on data change)
  useEffect(() => {
    subscribe(cacheKey, forceUpdate);
    return () => unsubscribe(cacheKey, forceUpdate);
  }, [cacheKey, forceUpdate]);

  // Listen to remote changes
  useEffect(() => {
    const changed = (status: AgentStatus) => {
      const newMeData = { agent: data?.agent, status };
      mutate(newMeData);
      return null;
    };

    const updated = (agent: Agent) => {
      const newMeData = { agent, status: data?.status };
      mutate(newMeData);
      return null;
    };

    if (agent) {
      agent.addAgentStatusChangedListener(changed);
      agent.addUpdatedListener(updated);

      // TODO need a way to remove listeners
    }
  }, [agent]);

  const data = getCache<MeData>(cacheKey);
  let profile = null as Profile | null;
  const perspective = data?.agent?.perspective;

  if (perspective) {
    profile = mapLiteralLinks(
      perspective.links.filter(
        (e) =>
          e.data.source === FLUX_PROFILE || e.data.source === data?.agent?.did
      ),
      {
        username: HAS_USERNAME,
        bio: HAS_BIO,
        givenName: HAS_GIVEN_NAME,
        email: HAS_EMAIL,
        familyName: HAS_FAMILY_NAME,
        profilePicture: HAS_PROFILE_IMAGE,
        profileThumbnailPicture: HAS_THUMBNAIL_IMAGE,
        profileBackground: HAS_BG_IMAGE,
      }
    ) as Profile;
  }

  return {
    status: data?.status,
    me: data?.agent,
    profile,
    error,
    mutate,
    reload: getData,
  };
}

function useForceUpdate() {
  const [, setState] = useState<number[]>([]);
  return useCallback(() => setState([]), [setState]);
}
