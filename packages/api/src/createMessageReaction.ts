import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { REACTION } from "./constants/communityPredicates";

export interface Payload {
  perspectiveUuid: string;
  reaction: string;
  messageUrl: string;
}

export default async function ({
  perspectiveUuid,
  messageUrl,
  reaction,
}: Payload) {
  try {
    const client = await getAd4mClient();

    const link = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: messageUrl,
        target: `emoji://${reaction}`,
        predicate: REACTION,
      })
    );

    return link;
  } catch (e: any) {
    throw new Error(e);
  }
}
