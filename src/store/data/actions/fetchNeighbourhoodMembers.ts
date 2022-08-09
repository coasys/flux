import { LinkExpression, LinkQuery } from "@perspect3vism/ad4m";

import { useDataStore } from "..";

import { MEMBER, SELF } from "@/constants/neighbourhoodMeta";
import { ad4mClient } from "@/app";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();

  const memberLinks = await ad4mClient.perspective.queryProlog(id, `triple(${SELF}, T, ${MEMBER}).`);
  const dids = memberLinks.map((linkTarget: any) => {
    const url = linkTarget.T;
    return url.includes("://") ? url.split("://")[1] : url;
  });
  for (const did of dids) {
    dataStore.setNeighbourhoodMember({ member: did, perspectiveUuid: id });
  }
}
