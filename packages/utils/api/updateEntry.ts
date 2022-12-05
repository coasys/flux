import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Entry, EntryInput } from "../types";
import { createLinks } from "../helpers/linkHelpers";

export async function updateEntry(
  id: string,
  entry: EntryInput
): Promise<Entry> {
  const client = await getAd4mClient();


  Object.values(entry.data).forEach([name, value] => {
    
  })

  const propertyLinks = await createLinks(id, entry.data);

  const linkPromises = allLinks.map(async (link) => {
    try {
      return client.perspective.addLink(entry.perspectiveUuid, link);
    } catch (e) {
      console.log(e);
    }
  });

  const createdLinks = await Promise.all(linkPromises);

  return {
    id,
    source,
    types: entry.types,
    timestamp: createdLinks[0].timestamp,
    author: createdLinks[0].author,
    data: entry.data,
  };
}
