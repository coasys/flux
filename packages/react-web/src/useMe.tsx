import { useState, useCallback, useEffect, useMemo } from "react";
import { getCache, setCache, subscribe, unsubscribe } from "./cache";
import { Agent, AgentStatus } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { mapLiteralLinks } from "@fluxapp/utils";
import { profile as profileConstants } from "@fluxapp/constants";
import { Profile } from "@fluxapp/types";

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

export function useMe(agent: AgentClient | undefined) {
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

    console.log("ADDING LISTERNER!");

    agent.addAgentStatusChangedListener(changed);
    agent.addUpdatedListener(updated);

    return () => {
      // agent.removeListener(added);
      // agent.removeListener(removed);
    };
  }, []);

  const data = getCache<MeData>(cacheKey);
  let profile = null as Profile | null;
  const perspective = data?.agent?.perspective;

  if (perspective) {
    profile = mapLiteralLinks(
      perspective.links.filter((e) => e.data.source === FLUX_PROFILE),
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
