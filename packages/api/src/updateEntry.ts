import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { PredicateMap } from "@fluxapp/types";
import { createLinks } from "@fluxapp/utils";
import { LinkQuery } from "@perspect3vism/ad4m";

export async function updateEntry(
  perspectiveUuid: string,
  id: string,
  updates: PredicateMap
) {
  const client = await getAd4mClient();

  for (let [predicate, value] of Object.entries(updates)) {
    const isArray = Array.isArray(value);
    // Remove all links if we upate an array
    if (isArray) {
      const links = await client.perspective.queryLinks(perspectiveUuid, {
        source: id,
        predicate,
      } as LinkQuery);

      links.forEach(async (link) => {
        await client.perspective.removeLink(perspectiveUuid, link);
      });
    }
  }

  const propertyLinks = await createLinks(id, updates);
  const createdLinks = await client.perspective.addLinks(
    perspectiveUuid,
    propertyLinks
  );
  return createdLinks;
}
