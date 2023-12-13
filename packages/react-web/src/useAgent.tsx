import { useState, useCallback, useEffect, useMemo } from "react";
import { getCache, setCache, subscribe, unsubscribe } from "./cache";
import { Agent } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { mapLiteralLinks } from "@coasys/flux-utils";
import { profile } from "@coasys/flux-constants";
import { Profile } from "@coasys/flux-types";
import { getProfile } from "@coasys/flux-api";

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
} = profile;

type Props = {
  client: AgentClient;
  did: string | (() => string);
};

export function useAgent(props: Props) {
  const forceUpdate = useForceUpdate();
  const [error, setError] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>(null);
  const didRef = typeof props.did === "function" ? props.did() : props.did;

  // Create cache key for entry
  const cacheKey = `agents/${didRef}`;

  // Mutate shared/cached data for all subscribers
  const mutate = useCallback(
    (agent: Agent | null) => setCache(cacheKey, agent),
    [cacheKey]
  );

  // Fetch data from AD4M and save to cache
  const getData = useCallback(() => {
    if (didRef) {
      getProfile(didRef).then(setProfile);

      props.client
        .byDID(didRef)
        .then(async (agent) => {
          setError(undefined);
          mutate(agent);
        })
        .catch((error) => setError(error.toString()));
    }
  }, [cacheKey]);

  // Trigger initial fetch
  useEffect(getData, [getData]);

  // Subscribe to changes (re-render on data change)
  useEffect(() => {
    subscribe(cacheKey, forceUpdate);
    return () => unsubscribe(cacheKey, forceUpdate);
  }, [cacheKey, forceUpdate]);

  const agent = getCache<Agent>(cacheKey);

  return { agent, profile, error, mutate, reload: getData };
}

function useForceUpdate() {
  const [, setState] = useState<number[]>([]);
  return useCallback(() => setState([]), [setState]);
}
