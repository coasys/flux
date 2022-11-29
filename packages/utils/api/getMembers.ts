import getProfile from "./getProfile";
import { SELF, MEMBER } from "../constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Profile } from "../types";

export interface Payload {
  perspectiveUuid: string;
}

export default async function ({
  perspectiveUuid,
}: Payload): Promise<Profile[]> {
  try {
    const client = await getAd4mClient();

    const memberLinks = await client.perspective.queryProlog(
      perspectiveUuid,
      `triple("${SELF}", "${MEMBER}", M).`
    );

    //@ts-ignore
    return Promise.all(memberLinks.map((member) => getProfile(member.M)));
  } catch (e) {
    throw new Error(e);
  }
}

export async function fetchMemberDids(perspectiveUuid: string): Promise<string[]> {
  const client = await getAd4mClient();

  const memberLinks = await client.perspective.queryProlog(
    perspectiveUuid,
    `triple("${SELF}", "${MEMBER}", M).`
  );

  return memberLinks.map((member: any) => member.M.replace("did://", ""));
}