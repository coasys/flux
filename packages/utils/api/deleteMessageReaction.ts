import { LinkExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";

export interface Payload {
  perspectiveUuid: string;
  linkExpression: LinkExpression;
}

export default async function ({ perspectiveUuid, linkExpression }: Payload) {
  try {
    const client = await getAd4mClient();

    await client.perspective.removeLink(perspectiveUuid, linkExpression);
  } catch (e: any) {
    throw new Error(e);
  }
}
