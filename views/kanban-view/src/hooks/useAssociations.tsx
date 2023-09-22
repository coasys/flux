import {
  LinkExpression,
  LinkQuery,
  PerspectiveProxy,
} from "@perspect3vism/ad4m";
import { useState, useEffect } from "preact/hooks";

export function useAssociations({
  source,
  predicate,
  perspective,
}: {
  source: string;
  predicate: string;
  perspective: PerspectiveProxy;
}) {
  const [associations, setAssosiations] = useState<LinkExpression[]>([]);

  async function fetchLinks() {
    const links = await perspective.get(new LinkQuery({ source, predicate }));
    setAssosiations(links);
  }

  async function add(target: string) {
    await perspective.add({ source, predicate, target });
  }

  async function remove(target: string) {
    const links = await perspective.get(
      new LinkQuery({ source, predicate, target })
    );
    perspective.removeLinks(links);
  }

  function handleLinkAdded(link: LinkExpression) {
    if (link.data.source === source && link.data.predicate === predicate) {
      setAssosiations((oldState) => [...oldState, link]);
    }

    return null;
  }

  function handleLinkRemoved(link: LinkExpression) {
    if (link.data.source === source && link.data.predicate === predicate) {
      setAssosiations((oldState) => {
        return oldState.filter((l) => l.proof.target !== link.proof.target);
      });
    }

    return null;
  }

  useEffect(() => {
    fetchLinks();

    perspective.addListener("link-added", handleLinkAdded);
    perspective.addListener("link-removed", handleLinkRemoved);

    return () => {
      perspective.removeListener("link-removed", handleLinkRemoved);
      perspective.removeListener("link-added", handleLinkAdded);
    };
  }, [perspective.uuid, source]);

  return { associations, add, remove };
}
