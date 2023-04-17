import { SubjectRepository } from "../factory";
import React, { useEffect, useState, useMemo } from "react";

export default function useEntry<SubjectClass>({
  perspective,
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
    return new SubjectRepository(model, {
      perspectiveUuid: perspective.uuid,
      source,
    });
  }, [perspective.uuid, source]);

  useEffect(() => {
    if (perspective.uuid) {
      Model.getData(id).then(async (entry) => {
        setEntry(entry);
      });
    }
  }, [perspective.uuid, source]);

  return { entry, model: Model };
}
