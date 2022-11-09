import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { DIRECTLY_SUCCEEDED_BY } from "../constants/communityPredicates";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  title: string;
  body: string;
}

export default async function ({
  perspectiveUuid,
  channelId,
  title,
  body,
}: Payload) {
  try {
    const client = await getAd4mClient();
    const titleExp = await client.expression.create(title, "literal");
    const contentExp = await client.expression.create(body, "literal");

    const result = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: channelId,
        target: contentExp,
        predicate: DIRECTLY_SUCCEEDED_BY,
      })
    );

    const messageParsed = getMessage(result);

    return messageParsed;
  } catch (e: any) {
    throw new Error(e);
  }
}
