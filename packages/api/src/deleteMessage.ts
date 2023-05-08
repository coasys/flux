import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { community } from "@fluxapp/constants";
const { DELETED } = community;

export interface Payload {
  perspectiveUuid: string;
  message: string;
}

export default async function ({ perspectiveUuid, message }: Payload) {
  try {
    const client = await getAd4mClient();

    const result = await client.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: message,
        target: "-",
        predicate: DELETED,
      })
    );

    return;
  } catch (e: any) {
    throw new Error(e);
  }
}
