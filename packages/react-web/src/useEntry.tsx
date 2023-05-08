import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";
import { SubjectRepository } from "@fluxapp/api";
import React, { useEffect, useState, useMemo } from "react";

export default function useEntry<SubjectClass>({
  perspective,
  source,
  id,
  model,
}: {
  perspective: PerspectiveProxy;
  source?: string;
  id?: string;
  model: SubjectClass;
}) {
  const [entry, setEntry] = useState<SubjectClass | null>(null);

  const Model = useMemo(() => {
    return new SubjectRepository(model, {
      perspective: perspective,
      source,
    });
  }, [perspective.uuid, source]);

  useEffect(() => {
    if (perspective.uuid) {
      getData(id);
      const { added, removed } = subscribe();
      return () => {
        perspective.removeListener("link-added", added);
        perspective.removeListener("link-removed", removed);
      };
    }
  }, [perspective.uuid, source, id]);

  function getData(id?: string) {
    Model.getData(id)
      .then(async (entry) => {
        setEntry(entry);
      })
      .catch(console.log);
  }

  function subscribe() {
    const added = (link: LinkExpression) => {
      const isNewEntry = link.data.source === source;

      setEntry((oldEntry) => {
        const isUpdated = oldEntry?.id === link.data.source;
        if (isUpdated) {
          getData(link.data.source);
        }
        return oldEntry;
      });

      return null;
    };

    const removed = (link: LinkExpression) => {
      if (link.data.target === source) {
        setEntry(null);
      }
      return null;
    };

    perspective.addListener("link-removed", removed);

    perspective.addListener("link-added", added);

    return { added, removed };
  }

  return { entry, model: Model };
}
