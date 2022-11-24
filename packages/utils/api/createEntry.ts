import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { v4 as uuidv4 } from "uuid";
import { Link } from "@perspect3vism/ad4m";
import { Entry, EntryInput } from "../types";
import { createLinks } from "../helpers/linkHelpers";
import { ENTRY_TYPE, SELF } from "../constants/communityPredicates";

export async function createEntry(entry: EntryInput): Promise<Entry> {
  const client = await getAd4mClient();

  const id = `flux_entry://${uuidv4()}`;
  const source = entry.source || SELF;

  const typeLinks = [] as Link[];
  for (const entryType of entry.types) {
    const entryLink = new Link({
      source: source,
      predicate: entryType,
      target: id,
    });
    const typeLink = new Link({
      source: id,
      predicate: ENTRY_TYPE,
      target: entryType,
    });
    typeLinks.push(entryLink);
    typeLinks.push(typeLink);
  }

  const propertyLinks = await createLinks(id, entry.data);

  const allLinks = [...typeLinks, ...propertyLinks];

  const linkPromises = allLinks.map((link) =>
    client.perspective.addLink(entry.perspectiveUuid, link)
  );

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
