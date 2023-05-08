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
  const { perspective, source = "ad4m://self", id, model } = props;
  const [error, setError] = useState<string | undefined>(undefined);
  const forceUpdate = useForceUpdate();

  const cacheKey = `${perspective.uuid}/${source || ""}/${id}`;

  const Model = useMemo(() => {
    return new SubjectRepository(model, {
      perspective: perspective,
      source,
    });
  }, [perspective.uuid, source]);

  const mutate = useCallback(
    (entry: SubjectClass | null) => setCache(cacheKey, entry),
    [cacheKey]
  );

  const getData = useCallback(() => {
    Model.getData(id)
      .then(async (entry) => {
        setError(undefined);
        mutate(entry);
      })
      .catch((error) => setError(error.toString()));
  }, [Model, mutate]);

  // function subscribe() {
  //   const added = (link: LinkExpression) => {
  //     // const isNewEntry = link.data.source === source;
  //     return null;
  //   };

  //   const removed = (link: LinkExpression) => {
  //     if (link.data.target === source) {
  //       mutate(null);
  //     }
  //     return null;
  //   };

  //   perspective.addListener("link-removed", removed);
  //   perspective.addListener("link-added", added);

  //   return { added, removed };
  // }

  // Trigger first fetch
  useEffect(getData, [getData]);

  // Subscribe to changes
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
