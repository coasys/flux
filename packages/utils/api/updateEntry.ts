import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { PredicateMap } from "../types";
import { createLinks } from "../helpers/linkHelpers";

export async function updateEntry(
  perspectiveUuid: string,
  id: string,
  updates: PredicateMap
) {
  const client = await getAd4mClient();

  const propertyLinks = await createLinks(id, updates);

  const linkPromises = propertyLinks.map(async (link) => {
    try {
      return client.perspective.addLink(perspectiveUuid, link);
    } catch (e) {
      console.log(e);
    }
  });

  await Promise.all(linkPromises);
}
