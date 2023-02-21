import { Link } from "@perspect3vism/ad4m";
import { CARD_HIDDEN, OMIT } from "../constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";

export interface Payload {
  perspectiveUuid: string;
  messageUrl: string;
}

export default async function ({ perspectiveUuid, messageUrl }: Payload) {
  try {
    const client = await getAd4mClient();

    const link = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: messageUrl,
        target: OMIT,
        predicate: CARD_HIDDEN,
      })
    );

    return link;
  } catch (e: any) {
    throw new Error(e);
  }
}
