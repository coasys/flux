import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { v4 as uuidv4 } from "uuid";
import { Link } from "@perspect3vism/ad4m";
import { Entry, EntryInput } from "@fluxapp/types";
import { createLinks } from "@fluxapp/utils";
import { community } from "@fluxapp/constants";

const { ENTRY_TYPE, SELF } = community;

export async function createEntry(entry: EntryInput): Promise<Entry> {
  const client = await getAd4mClient();

  const id = entry.id || `flux.entry://${uuidv4()}`;
  const source = entry.source || SELF;

  const entryLink = new Link({
    source: source,
    predicate: entry.type,
    target: id,
  });
  const typeLink = new Link({
    source: id,
    predicate: ENTRY_TYPE,
    target: entry.type,
  });

  const propertyLinks = await createLinks(id, entry.data);

  const allLinks = [...propertyLinks, entryLink, typeLink];

  const createdLinks = await client.perspective.addLinks(
    entry.perspectiveUuid,
    allLinks
  );

  return {
    id,
    source,
    //TODO: this should be types not type?
    type: entry.type,
    timestamp: createdLinks[0]!.timestamp,
    author: createdLinks[0]!.author,
  };
}
