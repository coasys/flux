import { LinkExpression, LinkQuery } from "@perspect3vism/ad4m";

import { useDataStore } from "..";

import { MEMBER } from "@/constants/neighbourhoodMeta";
import { ad4mClient } from "@/app";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();

  const neighbourhood = dataStore.getNeighbourhood(id);
  const memberLinks = await ad4mClient.perspective.queryLinks(
    id,
    new LinkQuery({
      source: neighbourhood.neighbourhoodUrl!,
      predicate: MEMBER,
    })
  );
  const dids = memberLinks.map((link: LinkExpression) => {
    const url = link.data.target;
    return url.includes("://") ? url.split("://")[1] : url;
  });
  for (const did of dids) {
    dataStore.setNeighbourhoodMember({ member: did, perspectiveUuid: id });
  }
}
