import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import React, { useEffect, useState, useMemo } from "react";
import { SubjectRepository } from "../factory";
import { Factory, SubjectEntry } from "../helpers/model";

export default function useEntries<SubjectClass>({
  perspectiveUuid,
  source,
  model,
}: {
  perspectiveUuid: string;
  source?: string | null | undefined;
  model: SubjectClass;
}) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SubjectClass[]>([]);

  const Model = useMemo(() => {
    const subject = new SubjectRepository(model, { perspectiveUuid, source });

    return subject;
  }, [perspectiveUuid, source]);

  useEffect(() => {
    if (perspectiveUuid && source !== null) {
      getAll();
      subscribe();
    }
    return () => Model?.unsubscribe();
  }, [source]);

  async function getAll() {
    try {
      setLoading(true);
      const entries = await Model.getAllData();

      setEntries(entries);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  function subscribe() {
    Model.onAdded(async (entry) => {
      setEntries((oldEntries) => {
        const hasEntry = oldEntries.find((e) => e.id === entry.id);
        return hasEntry ? oldEntries : [entry, ...oldEntries];
      });
    });
  }

  return { entries, model: Model, loading };
}
