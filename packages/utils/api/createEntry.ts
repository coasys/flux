import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {v4 as uuidv4} from "uuid";
import { Link } from "@perspect3vism/ad4m";
import { Entry, EntryInput } from "../types";
import { createLinks } from "../helpers/linkHelpers";
import { ENTRY_TYPE } from "../constants/communityPredicates";

export async function createEntry(entry: EntryInput): Promise<Entry> {
  const client = await getAd4mClient();

  const id = uuidv4();
  const source = entry.source || "ad4m://self";

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
    })
    typeLinks.push(entryLink);
    typeLinks.push(typeLink);
  }

  const propertyLinks = await createLinks(id, entry.data);

  const allLinks = [...typeLinks, ...propertyLinks];

  let firstLink;
  allLinks.forEach(async (link) => {
    const linkExpression = await client.perspective.addLink(entry.perspectiveUuid, link);
    firstLink = linkExpression.timestamp;
  });

  return {
    id,
    source,
    types: entry.types,
    createdAt: firstLink.timestamp,
    author: firstLink.author,
    data: entry.data,
  };
}