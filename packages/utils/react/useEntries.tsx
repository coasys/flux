import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
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
      let ad4m = await getAd4mClient()
      let perspective = await ad4m.perspective.byUUID(perspectiveUuid)

      const entries = await Model.getAll();

      const promiseList = [];
      for (const entry of entries) {
        const channelEntry = new SubjectEntry(entry, perspective!)
        await channelEntry.load()

        // @ts-ignore
        const tempModel = new model();

        for (const [key] of Object.entries(tempModel)) {
          tempModel[key] = await entry[key]
        }

        promiseList.push({
          ...tempModel,
          id: await entry.baseExpression,
          timestamp: channelEntry.timestamp,
          author: channelEntry.author
        })
      }

      const awaitedList = await Promise.all(promiseList);


      setEntries(awaitedList);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  function subscribe() {
    Model.onAdded((entry) => {
      setEntries((oldEntries) => {
        const hasEntry = oldEntries.find((e) => e.id === entry.id);
        return hasEntry ? oldEntries : [entry, ...oldEntries];
      });
    });
  }

  return { entries, model: Model, loading };
}
