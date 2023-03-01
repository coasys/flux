import { SubjectRepository } from "../factory";
import React, { useEffect, useState, useMemo } from "react";

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
      Model.getData(id).then(async (entry) => {
        setEntry(entry);
      });
    }
  }, [perspectiveUuid, source]);

  return { entry, model: Model };
}
