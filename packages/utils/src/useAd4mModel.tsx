import { useState, useEffect, useMemo } from "react";
import { PerspectiveProxy, SubjectEntity, Query } from "@coasys/ad4m";

type Props<T extends SubjectEntity> = {
  perspective: PerspectiveProxy;
  model: (new (...args: any[]) => T) & typeof SubjectEntity;
  query?: Query;
  pageSize?: number;
  preserveReferences?: boolean;
};

type Result<T extends SubjectEntity> = {
  entries: T[];
  loading: boolean;
  error: string;
  totalCount: number;
  loadMore: () => void;
  setEntries: React.Dispatch<React.SetStateAction<T[]>>;
};

export function useAd4mModel<T extends SubjectEntity>(props: Props<T>): Result<T> {
  const { perspective, model, query = {}, preserveReferences = true, pageSize } = props;
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<T[]>([]);
  const [error, setError] = useState<string>("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  function preserveEnrtyReferences(oldEntries: T[], newEntries: T[]): T[] {
    // Merge new results into old results, preserving references for optimized rendering
    const existingMap = new Map(oldEntries.map((entry) => [entry.baseExpression, entry]));
    return newEntries.map((newEntry) => existingMap.get(newEntry.baseExpression) || newEntry);
  }

  function subscribeCallback(newEntries: T[]) {
    setEntries((oldEntries) => (preserveReferences ? preserveEnrtyReferences(oldEntries, newEntries) : newEntries));
  }

  async function subscribeToCollection() {
    try {
      const modelQuery = model.query(perspective, query);
      if (pageSize) {
        // handle paginated results
        const { results, totalCount } = await modelQuery.paginateSubscribe(pageSize * pageNumber, 1, subscribeCallback);
        setEntries(results);
        setTotalCount(totalCount);
      } else {
        // handle non-paginated results
        const results = await modelQuery.subscribe(subscribeCallback);
        setEntries(results);
      }
    } catch (err) {
      console.log("useAd4mModel error", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    if (pageSize) {
      setLoading(true);
      setPageNumber((prevPage) => prevPage + 1);
    }
  }

  useEffect(() => {
    subscribeToCollection();
  }, [JSON.stringify(query), pageNumber]);

  return useMemo(() => ({ entries, loading, error, totalCount, loadMore, setEntries }), [entries, loading, error]);
}
