import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { CHANNEL, SELF } from "utils/constants/communityPredicates";

export interface LinkData {
  id: string;
  timestamp: Date | string;
  author: string;
}

export async function deleteChannel(
  perspectiveUuid: string,
  linkData: LinkData
): Promise<void> {
  const client = await getAd4mClient();
  await client.perspective.removeLink(perspectiveUuid, {
    author: linkData.author,
    data: {
      predicate: CHANNEL,
      target: linkData.id,
      source: SELF,
    },
    proof: {
      invalid: false,
      key: "",
      signature: "",
      valid: true,
    },
    timestamp: linkData.timestamp,
  });
}
