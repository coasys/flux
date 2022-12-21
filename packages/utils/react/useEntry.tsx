import React, { useEffect, useState, useMemo } from "react";
import EntryModel from "../helpers/model";

export default function useEntry({
  perspectiveUuid,
  source,
  id,
  model,
}: {
  perspectiveUuid: string;
  source?: string;
  id: string;
  model: typeof EntryModel;
}) {
  const [entry, setEntry] = useState(null);

  const Model = useMemo(() => {
    return new model({ perspectiveUuid, source });
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
