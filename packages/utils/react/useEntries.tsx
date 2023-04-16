import React, { useEffect, useState, useMemo } from "react";
import { SubjectRepository } from "../factory";

export default function useEntries<SubjectClass>({
  perspectiveUuid,
  source,
  model,
}: {
  perspectiveUuid: string;
  source?: string | null | undefined;
  model: SubjectClass;
}) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<SubjectClass[]>([]);

  const Model: SubjectRepository<{
    [x: string]: any;
  }> = useMemo(() => {
    const subject = new SubjectRepository(model as any, {
      perspectiveUuid,
      source: source || undefined,
    });
    return subject;
  }, [perspectiveUuid, source]);

  useEffect(() => {
    if (perspectiveUuid && source !== null) {
      getAll();
      subscribe();
    }
    return () => Model?.unsubscribe();
  }, [perspectiveUuid, source]);

  async function getAll() {
    try {
      setLoading(true);

      const entries = await Model?.getAllData();

      setEntries(entries);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  function subscribe() {
    Model?.onUpdated(async (id) => {
      const updatedEntry = await Model?.getData(id);

      console.log(updatedEntry);

      if (updatedEntry) {
        setEntries((oldEntries) => {
          return oldEntries.map((e) => {
            e.id === id ? updatedEntry : e;
          });
        });
      }
    }, "all");

    Model?.onAdded(async (entry) => {
      setEntries((oldEntries) => {
        const hasEntry = oldEntries.find((e) => e.id === entry.id);
        return hasEntry ? oldEntries : [entry, ...oldEntries];
      });
    }, "all");
  }

  return { entries, model: Model, loading };
}
