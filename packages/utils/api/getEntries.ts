import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { extractPrologResults } from "../helpers/prologHelpers";
import { GetEntries, Entry } from "../types";
import { getPrologQuery } from "../helpers/formatString";

export default async function getEntries(input: GetEntries): Promise<Entry[]> {
  const client = await getAd4mClient();
  const entries = [] as Entry[];
  for (const query of input.queries) {
    const prologQuery = getPrologQuery(query.query, query.variables);
    const prologResult = await client.perspective.queryProlog(
      input.perspectiveUuid,
      prologQuery
    );

    const cleanedPrologResult = await extractPrologResults(
      prologResult,
      query.resultKeys
    );

    for (const result of cleanedPrologResult) {
      const entry = {} as Entry;
      if (result.Id) {
        entry.id = result.Id;
        delete result.Id;
      }
      if (result.Author) {
        entry.author = result.Author;
        delete result.Author;
      }
      if (result.Timestamp) {
        entry.timestamp = new Date(result.Timestamp);
        delete result.Timestamp;
      }
      if (result.Source) {
        entry.source = result.Source;
        delete result.Source;
      }
      if (result.Types) {
        entry.types = result.Types;
        delete result.Types;
      }
      entry.data = result;
      entries.push(entry);
    }
  }
  return entries;
}
