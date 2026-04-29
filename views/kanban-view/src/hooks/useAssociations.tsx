import { LinkExpression, LinkQuery, PerspectiveProxy } from '@coasys/ad4m';
import { useState, useEffect } from 'preact/hooks';

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
    const links = await perspective.get(new LinkQuery({ source, predicate, target }));
    perspective.removeLinks(links);
  }

  useEffect(() => {
    fetchLinks();

    // Use a targeted SPARQL subscription instead of global link listeners
    const sparql = `SELECT ?target WHERE { <${source}> <${predicate}> ?target . }`;
    let sub: any = null;
    perspective.subscribeQuery(sparql).then((handle) => {
      sub = handle;
      handle.onResult(() => { fetchLinks(); });
    });

    return () => {
      sub?.dispose();
    };
  }, [perspective.uuid, source]);

  return { associations, add, remove };
}
