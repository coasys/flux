import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getCache,
  getSubscribers,
  setCache,
  subscribe,
  subscribeToPerspective,
  unsubscribe,
  unsubscribeToPerspective,
} from "./cache";
import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";
import { SubjectRepository } from "@fluxapp/api";

type Props<SubjectClass> = {
  source: string;
  perspective: PerspectiveProxy;
  model: (new () => SubjectClass) | "string";
};

export function useEntries<SubjectClass>(props: Props<SubjectClass>) {
  const forceUpdate = useForceUpdate();
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { perspective, source, model } = props;

  // Create cache key for entry
  const cacheKey = `${perspective.uuid}/${source || ""}/${
    typeof model === "string" ? model : model.prototype.className
  }`;

  // Create model
  const Model = useMemo(() => {
    return new SubjectRepository(model, {
      perspective: perspective,
      source,
    });
  }, [cacheKey]);

  // Mutate shared/cached data for all subscribers
  const mutate = useCallback(
    (entry: SubjectClass[]) => setCache(cacheKey, entry),
    [cacheKey]
  );

  // Fetch data from AD4M and save to cache
  const getData = useCallback(() => {
    const subs = getSubscribers(cacheKey);

    if (source) {
      console.log(`fetching data from remote`, subs);
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
    }
  }, [cacheKey]);

  // Trigger initial fetch
  useEffect(getData, [cacheKey]);

  // Get single entry
  async function fetchEntry(id) {
    const entry = (await Model.getData(id)) as SubjectClass;
    const oldEntries = (getCache(cacheKey) as SubjectClass[]) || [];
    const isOldEntry = oldEntries?.some((i) => i.id === id);

    const newEntries = isOldEntry
      ? oldEntries?.map((oldEntry) => {
          const isUpdatedEntry = id === oldEntry.id;
          return isUpdatedEntry ? entry : oldEntry;
        })
      : [...oldEntries, entry];

    mutate(newEntries);
  }

  async function linkAdded(link: LinkExpression) {
    const allEntries = (getCache(cacheKey) || []) as SubjectClass[];
    const isNewEntry = link.data.source === source;
    const isUpdated = allEntries?.find((e) => e.id === link.data.source);

    const id = isNewEntry
      ? link.data.target
      : isUpdated
      ? link.data.source
      : false;

    if (id) {
      const isInstance = await perspective.isSubjectInstance(
        id,
        typeof model === "string" ? model : new model()
      );

      if (isInstance) {
        fetchEntry(id);
      }
    }

    return null;
  }

  async function linkRemoved(link: LinkExpression) {
    const allEntries = (getCache(cacheKey) || []) as SubjectClass[];

    // Check if an association/property was removed
    const removedAssociation = allEntries.some(
      (e) => e.id === link.data.source
    );

    if (removedAssociation) {
      getData();
    }

    // Remove entries if they are removed from source
    if (link.data.source === source) {
      const newEntries = allEntries?.filter((e) => e.id !== link.data.target);
      mutate(newEntries || []);
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
  }, [perspective.uuid, cacheKey]);

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

  const entries = (getCache(cacheKey) || []) as ExtendedSubjectClass[];

  return { entries, error, mutate, model: Model, isLoading, reload: getData };
}

function useForceUpdate() {
  const [, setState] = useState<number[]>([]);
  return useCallback(() => setState([]), [setState]);
}
