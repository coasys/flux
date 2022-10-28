import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { useDataStore } from "..";
import { MEMBER, SELF } from "utils/constants/communityPredicates";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();

  const client = await getAd4mClient();

  const memberLinks = await client.perspective.queryProlog(
    id,
    `triple("${SELF}", "${MEMBER}", M).`
  );

  const dids = memberLinks.map((member: any) => member.M.replace("did://", ""));

  dataStore.setNeighbourhoodMembers({ members: dids, perspectiveUuid: id });
}
