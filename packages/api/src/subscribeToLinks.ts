import { Ad4mClient, LinkExpression, PerspectiveProxy } from '@coasys/ad4m';

type LinkCallback = (link: LinkExpression) => null;

export interface Payload {
  client: Ad4mClient;
  perspectiveUuid: string;
  added?: LinkCallback;
  removed?: LinkCallback;
}

function removeListeners({
  perspective,
  added,
  removed,
}: {
  perspective: PerspectiveProxy | null;
  added?: LinkCallback;
  removed?: LinkCallback;
}) {
  if (added) {
    perspective?.removeListener('link-added', added);
  }

  if (removed) {
    perspective?.removeListener('link-removed', removed);
  }
}

/**
 * @deprecated Use `perspective.subscribeQuery(sparql, callback)` for targeted
 * SPARQL-based subscriptions instead of global link-added/link-removed listeners.
 */
export default async function ({ client, perspectiveUuid, added, removed }: Payload): Promise<() => void> {
  try {
    const perspective = await client.perspective.byUUID(perspectiveUuid);

    if (added) {
      perspective?.addListener('link-added', added);
    }

    if (removed) {
      perspective?.addListener('link-removed', removed);
    }

    return removeListeners.bind(null, { perspective, added, removed });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
}
