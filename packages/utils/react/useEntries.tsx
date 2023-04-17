import React, { useEffect, useState, useMemo } from "react";
import { SubjectRepository } from "../factory";
import { LinkExpression, PerspectiveProxy } from "@perspect3vism/ad4m";

export default function useEntries<SubjectClass>({
  perspective,
  source,
  model,
}: {
  perspective: PerspectiveProxy;
  source?: string | null | undefined;
  model: SubjectClass;
}) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<[{ [x: string]: any }]>([]);

  const Model: SubjectRepository<{
    [x: string]: any;
  }> = useMemo(() => {
    const subject = new SubjectRepository(model as any, {
      perspectiveUuid: perspective.uuid,
      source: source || undefined,
    });
    return subject;
  }, [perspective.uuid, source]);

  useEffect(() => {
    if (perspective.uuid && source !== null) {
      getAll();
      const { added, removed } = subscribe();
      return () => {
        perspective.removeListener("link-added", added);
        perspective.removeListener("link-removed", removed);
      };
    }
  }, [perspective.uuid, source]);

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

  async function fetchEntry(id) {
    const entry = await Model.getData(id);

    setEntries((oldEntries) => {
      const isUpdatedEntry = oldEntries.find((e) => e.id === entry.id);
      return isUpdatedEntry
        ? oldEntries.map((e) => {
            const isTheUpdatedOne = e.id === isUpdatedEntry.id;
            return isTheUpdatedOne ? entry : e;
          })
        : [...oldEntries, entry];
    });
  }

  function subscribe() {
    const added = (link: LinkExpression) => {
      const isNewEntry = link.data.source === source;

      setEntries((oldEntries) => {
        const isUpdated = oldEntries.find((e) => e.id === link.data.source);
        if (isUpdated) {
          fetchEntry(link.data.source);
        }

        if (isNewEntry) {
          fetchEntry(link.data.target);
        }

        return oldEntries;
      });

      return null;
    };

    const removed = (link: LinkExpression) => {
      if (link.data.source === source) {
        setEntries((oldEntries) => {
          return oldEntries.filter((e) => e.id !== link.data.target);
        });
      }
      return null;
    };

    perspective.addListener("link-removed", removed);

    perspective.addListener("link-added", added);

    return { added, removed };
  }

  return { entries, model: Model, loading };
}
