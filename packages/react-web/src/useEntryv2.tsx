import { useState, useCallback, useEffect, useMemo } from "react";
import { getCache, setCache, subscribe, unsubscribe } from "./cache";
import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";
import { SubjectRepository } from "@fluxapp/api";

type Props<SubjectClass> = {
  id?: string;
  source?: string;
  perspective: PerspectiveProxy;
  model: SubjectClass;
};

export function useEntry<SubjectClass>(props: Props<SubjectClass>) {
  const forceUpdate = useForceUpdate();
  const [error, setError] = useState<string | undefined>(undefined);
  const { perspective, source = "ad4m://self", id, model } = props;
  const cacheKey = `${perspective.uuid}/${source || ""}/${id}`;

  // Create model
  const Model = useMemo(() => {
    return new SubjectRepository(model, {
      perspective: perspective,
      source,
    });
  }, [perspective.uuid, source]);

  // Mutate shared/cached data for all subscribers
  const mutate = useCallback(
    (entry: SubjectClass | null) => setCache(cacheKey, entry),
    [cacheKey]
  );

  // Fetch data from AD4M and save to cache
  const getData = useCallback(() => {
    Model.getData(id)
      .then(async (entry) => {
        setError(undefined);
        mutate(entry);
      })
      .catch((error) => setError(error.toString()));
  }, [Model, mutate]);

  // Trigger initial fetch
  useEffect(getData, [getData]);

  // Listen to remote changes
  useEffect(() => {
    if (perspective.uuid) {
      const added = (link: LinkExpression) => {
        // const isNewEntry = link.data.source === source;
        return null;
      };

      const removed = (link: LinkExpression) => {
        if (link.data.target === source) {
          mutate(null);
        }
        return null;
      };

      perspective.addListener("link-added", added);
      perspective.addListener("link-removed", removed);

      return () => {
        perspective.removeListener("link-added", added);
        perspective.removeListener("link-removed", removed);
      };
    }
  }, [perspective.uuid, source, id]);

  // Subscribe to changes (re-render on data change)
  useEffect(() => {
    subscribe(cacheKey, forceUpdate);
    return () => unsubscribe(cacheKey, forceUpdate);
  }, [cacheKey, forceUpdate]);

  const entry = getCache(cacheKey) as SubjectClass | undefined;

  return { entry, error, mutate, model: Model, reload: getData };
}

function useForceUpdate() {
  const [, setState] = useState<number[]>([]);
  return useCallback(() => setState([]), [setState]);
}
