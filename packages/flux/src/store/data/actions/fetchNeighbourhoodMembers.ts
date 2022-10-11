import { LinkExpression } from "@perspect3vism/ad4m";

import { useDataStore } from "..";

import { MEMBER, SELF } from "utils/constants/neighbourhoodMeta";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const client = await getAd4mClient();

  const memberLinks = await client.perspective.queryProlog(
    id,
    `triple("${SELF}", "${MEMBER}", M).`
  );
  const dids = memberLinks.map((link: LinkExpression) => {
    const url = link.M;
    return url.includes("://") ? url.split("://")[1] : url;
  });
  for (const did of dids) {
    dataStore.setNeighbourhoodMember({ member: did, perspectiveUuid: id });
  }
}
