import getMember from "./getProfile";
import { SELF, MEMBER } from "../constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
  addProfile: (profile: any) => {};
}

export default async function ({ perspectiveUuid, neighbourhoodUrl, addProfile }: Payload) {
  try {
    const client = await getAd4mClient();
    
    const memberLinks = await client.perspective.queryProlog(perspectiveUuid, `triple("${SELF}", "${MEMBER}", M).`);
    for (const link of memberLinks) {
      getMember(link.M).then((member) => {
        if (member) {
          addProfile(member)
        }
      });
    }
  } catch (e) {
    throw new Error(e);
  }
}
