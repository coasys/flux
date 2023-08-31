import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getCache,
  setCache,
  subscribe,
  subscribeToPerspective,
  unsubscribe,
  unsubscribeToPerspective,
} from "./cache";
import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";
import { SubjectRepository } from "@fluxapp/api";

type Props<SubjectClass> = {
  id?: string;
  source?: string;
  perspective: PerspectiveProxy;
  model: new () => SubjectClass;
};

export function useEntry<SubjectClass>(props: Props<SubjectClass>) {
  const forceUpdate = useForceUpdate();
  const [error, setError] = useState<string | undefined>(undefined);
  const { perspective, source = "ad4m://self", id, model } = props;

  // Create model
  const Model = useMemo(() => {
    return new SubjectRepository(model, {
      perspective: perspective,
      source,
    });
  }, [perspective.uuid, source, model]);

  // Create cache key for entry
  const cacheKey = `${perspective.uuid}/${source || ""}/${model.name}/${id}`;

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

  async function linkAdded(link: LinkExpression) {
    const isUpdated = link.data.source === id;

    if (isUpdated) {
      getData();
    }

    return null;
  }

  async function linkRemoved(link: LinkExpression) {
    if (link.data.target === source) {
      mutate(null);
    }
    if (link.data.source === id) {
      getData();
    }
    return null;
  }

  // Listen to remote changes
  useEffect(() => {
    if (perspective.uuid) {
      subscribeToPerspective(perspective, linkAdded, linkRemoved);

      return () => {
        unsubscribeToPerspective(perspective, linkAdded, linkRemoved);
      };
    }
  }, [perspective.uuid, source, id]);

  // Subscribe to changes (re-render on data change)
  useEffect(() => {
    subscribe(cacheKey, forceUpdate);
    return () => unsubscribe(cacheKey, forceUpdate);
  }, [cacheKey, forceUpdate]);

  type ExtendedSubjectClass = SubjectClass & {
    id: string;
    timestamp: number;
    author: string;
  };

  const entry = getCache<ExtendedSubjectClass>(cacheKey);

  return { entry, error, mutate, model: Model, reload: getData };
}

function useForceUpdate() {
  const [, setState] = useState<number[]>([]);
  return useCallback(() => setState([]), [setState]);
}
