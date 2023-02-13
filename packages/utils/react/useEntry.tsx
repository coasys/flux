import { SubjectRepository } from "../factory";
import React, { useEffect, useState, useMemo } from "react";
import { Factory, SubjectEntry } from "../helpers/model";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export default function useEntry<SubjectClass>({
  perspectiveUuid,
  source,
  id,
  model,
}: {
  perspectiveUuid: string;
  source?: string;
  id?: string;
  model: SubjectClass;
}) {
  const [entry, setEntry] = useState<SubjectClass | null>(null);

  const Model = useMemo(() => {
    return new SubjectRepository(model, { perspectiveUuid, source });
  }, [perspectiveUuid, source]);

  useEffect(() => {
    if (perspectiveUuid) {
      
      Model.get(id).then(async (entry) => {
        let ad4m = await getAd4mClient()
        let perspective = await ad4m.perspective.byUUID(perspectiveUuid)
        
        const channelEntry = new SubjectEntry(entry, perspective!)
        await channelEntry.load()

        // @ts-ignore
        const tempModel = new model();

        for (const [key] of Object.entries(tempModel)) {
          tempModel[key] = await entry[key]
        }

        setEntry({
          ...entry,
          timestamp: channelEntry.timestamp,
          author: channelEntry.author
        });
      });
    }
  }, [perspectiveUuid, source]);

  return { entry, model: Model };
}
