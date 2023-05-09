import { useState, useCallback, useEffect, useMemo } from "react";
import { getCache, setCache, subscribe, unsubscribe } from "./cache";
import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";
import { SubjectRepository } from "@fluxapp/api";

type Props<SubjectClass> = {
  source?: string;
  perspective: PerspectiveProxy;
  model: new () => SubjectClass;
};

export function useEntries<SubjectClass>(props: Props<SubjectClass>) {
  const forceUpdate = useForceUpdate();
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { perspective, source = "ad4m://self", model } = props;

  // Create model
  const Model = useMemo(() => {
    return new SubjectRepository(model, {
      perspective: perspective,
      source,
    });
  }, [perspective.uuid, source]);

  // Create cache key for entry
  const cacheKey = `${perspective.uuid}/${source || ""}/${model.name}/`;

  // Mutate shared/cached data for all subscribers
  const mutate = useCallback(
    (entry: SubjectClass[]) => setCache(cacheKey, entry),
    [cacheKey]
  );

  // Fetch data from AD4M and save to cache
  const getData = useCallback(() => {
    // setIsLoading(true);
    Model.getAllData()
      .then((entries) => {
        setError(undefined);
        mutate(entries);
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [Model, mutate]);

  // Trigger initial fetch
  useEffect(getData, [getData]);

  // Get single entry
  async function fetchEntry(id) {
    const entry = (await Model.getData(id)) as SubjectClass;
    const oldEntries = getCache(cacheKey) as SubjectClass[] | undefined;
    const isOldEntry = oldEntries.some((i) => i.id === id);

    const newEntries = isOldEntry
      ? oldEntries?.map((oldEntry) => {
          const isUpdatedEntry = id === oldEntry.id;
          return isUpdatedEntry ? entry : oldEntry;
        })
      : [entry];

    mutate(newEntries);
  }

  // Listen to remote changes
  useEffect(() => {
    if (perspective.uuid) {
      const added = async (link: LinkExpression) => {
        const isNewEntry = link.data.source === source;
        const isUpdated = entries?.find((e) => e.id === link.data.source);
        const id = isNewEntry
          ? link.data.target
          : isUpdated
          ? link.data.source
          : false;

        if (id) {
          const isInstance = await perspective.isSubjectInstance(
            id,
            new model()
          );

          if (isInstance) {
            fetchEntry(id);
          }
        }

        return null;
      };

      const removed = (link: LinkExpression) => {
        if (link.data.target === source) {
          const newEntries = entries?.filter((e) => e.id !== link.data.target);
          mutate(newEntries || []);
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
  }, [perspective.uuid, source]);

  // Subscribe to changes (re-render on data change)
  useEffect(() => {
    subscribe(cacheKey, forceUpdate);
    return () => unsubscribe(cacheKey, forceUpdate);
  }, [cacheKey, forceUpdate]);

  const entries = (getCache(cacheKey) || []) as SubjectClass[];

  return { entries, error, mutate, model: Model, isLoading, reload: getData };
}

function useForceUpdate() {
  const [, setState] = useState<number[]>([]);
  return useCallback(() => setState([]), [setState]);
}
