import { v4 as uuidv4 } from "uuid";
import { Link } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { createLiteralLinks } from "./linkHelpers";
import { EntryInput, Entry } from "../types";

export async function createEntry(entry: EntryInput): Promise<Entry> {
  const client = await getAd4mClient();

  const id = uuidv4();
  const source = entry.source || "ad4m://self";

  const entryLink = new Link({
    source: source,
    predicate: "flux://entry",
    target: id,
  });

  const entryRecord = await client.perspective.addLink(
    entry.perspectiveUuid,
    entryLink
  );

  const types = Array.isArray(entry.type) ? entry.type : [entry.type];

  const typeLinks = types.map(
    (type) =>
      new Link({
        source: id,
        predicate: "flux://entry_type",
        target: type,
      })
  );

  const propertyLinks = await createLiteralLinks(id, entry.data);

  const allLinks = [...typeLinks, ...propertyLinks];

  allLinks.forEach(async (link) => {
    await client.perspective.addLink(entry.perspectiveUuid, link);
  });

  return {
    id,
    type: types,
    createdAt: entryRecord.timestamp,
    author: entryRecord.author,
    data: entry.data,
  };
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  return undefined
}

export async function getEntries(): Promise<Entry[]> {
  return []
}