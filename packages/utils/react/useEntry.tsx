import React, { useEffect, useState, useMemo } from "react";
import { Factory } from "../helpers/model";

export default function useEntry<SubjectClass>({
  perspectiveUuid,
  source,
  id,
  model,
}: {
  perspectiveUuid: string;
  source?: string;
  id: string;
  model: SubjectClass;
}) {
  const [entry, setEntry] = useState<SubjectClass | null>(null);

  const Model = useMemo(() => {
    return new Factory(model, { perspectiveUuid, source });
  }, [perspectiveUuid, source]);

  useEffect(() => {
    if (perspectiveUuid) {
      Model.get(id).then((entry) => {
        setEntry(entry);
      });
    }
  }, [perspectiveUuid, source]);

  return { entry, model: Model };
}
