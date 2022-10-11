import getMember from "./getProfile";
import ad4mClient from "./client";
import { SELF, MEMBER } from "../constants/ad4m";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
  addProfile: (profile: any) => {};
}

export default async function ({ perspectiveUuid, neighbourhoodUrl, addProfile }: Payload) {
  try {
    const memberLinks = await ad4mClient.perspective.queryProlog(perspectiveUuid, `triple("${SELF}", "${MEMBER}", M).`);
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
