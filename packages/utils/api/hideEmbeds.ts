import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";
import { CARD_HIDDEN, OMIT } from "../constants/ad4m";

export interface Payload {
  perspectiveUuid: string;
  messageUrl: string;
}

export default async function ({
  perspectiveUuid,
  messageUrl,
}: Payload) {
  try {
    const link = await ad4mClient.perspective.addLink(
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
