import { EntryType, ModelProperty, Entry } from "@fluxapp/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { Literal } from "@perspect3vism/ad4m";

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function lowerCaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function generateFindAll(propertyName, predicate) {
  const name = capitalizeFirstLetter(propertyName);
  return `findall((${name}, ${name}Timestamp, ${name}Author), link(Id, "${predicate}", ${name}, ${name}Timestamp, ${name}Author), ${name})`;
}

export function generatePrologQuery({
  id,
  type,
  source,
  properties,
}: {
  id?: string;
  source?: string;
  type: EntryType;
  properties: {
    [x: string]: ModelProperty;
  };
}) {
  const idParam = id ? `"${id}"` : `Id`;
  const sourceParam = source ? `"${source}"` : `Source`;

  const propertyNames = Object.keys(properties).reduce((acc, name) => {
    const concatVal = acc === "" ? "" : ", ";
    return acc.concat(concatVal, capitalizeFirstLetter(name));
  }, "");

  const findProperties = Object.keys(properties).reduce((acc, name) => {
    const property = properties[name];
    const concatVal = acc === "" ? "" : ", ";
    return acc.concat(concatVal, generateFindAll(name, property.predicate));
  }, "");

  const entryQuery = `
    entry_query(Source, Type, Id, Timestamp, Author, ${propertyNames}):-
      link(Source, Type, Id, Timestamp, Author),
      ${findProperties}
  `;

  const entry = `
    entry(Source, Id, Timestamp, Author, ${propertyNames}):- 
      entry_query(Source, "${type}", Id, Timestamp, Author, ${propertyNames})
  `;

  return {
    assertQuery: `assertz((${entryQuery})).`,
    assertEntry: `assertz((${entry})).`,
    query: `entry(Source, Id, Timestamp, Author, ${propertyNames}), (Source = ${sourceParam}, Id = ${idParam}).`,
    retractQuery: `retract((${entryQuery})).`,
    retractEntry: `retract((${entry})).`,
  };
}

export async function queryProlog({
  perspectiveUuid,
  id,
  type,
  source,
  properties,
}: {
  perspectiveUuid: string;
  id?: string;
  source?: string;
  type: EntryType;
  properties: {
    [x: string]: ModelProperty;
  };
}): Promise<Entry[]> {
  const client = await getAd4mClient();

  const { query, assertQuery, assertEntry, retractQuery, retractEntry } =
    generatePrologQuery({
      id,
      type,
      source,
      properties,
    });

  //This queryProlog call is used to assert the entry_query() rule
  await client.perspective.queryProlog(perspectiveUuid, assertQuery);
  //This queryProlog call is used to assert the entry() rule
  await client.perspective.queryProlog(perspectiveUuid, assertEntry);

  //This query is the one which actually fetches the results from the rules declared above
  const prologResult = await client.perspective.queryProlog(
    perspectiveUuid,
    query
  );

  //This queryProlog call is used to retract the entry_query() rule, so that we dont get duplicate rules/results in the prolog engine
  await client.perspective.queryProlog(perspectiveUuid, retractQuery);
  //This queryProlog call is used to retract the entry() rule, so that we dont get duplicate rules/results in the prolog engine
  await client.perspective.queryProlog(perspectiveUuid, retractEntry);

  const entries = extractPrologResults(prologResult, [
    "Source",
    "Id",
    "Timestamp",
    "Author",
    ...Object.keys(properties).map((name) => capitalizeFirstLetter(name)),
  ]);

  const result = await Promise.all(
    entries.map((entry) => resolveEntryWithLatestProperties(entry, properties))
  );
  return result;
}

export async function resolveEntryWithLatestProperties(
  entry,
  properties: {
    [x: string]: ModelProperty;
  }
): Promise<Entry> {
  const client = await getAd4mClient();
  const propertyNames = Object.keys(entry);
  let cleanedEntry = {} as Entry;

  propertyNames.forEach(async (name) => {
    const lowerCaseName = lowerCaseFirstLetter(name);
    const prop = properties[lowerCaseName];
    const val = entry[name];
    const isArray = Array.isArray(val);

    async function resolveExp(url) {
      return url.startsWith("literal://")
        ? Literal.fromUrl(url).get().data
        : (await client.expression.get(url)).data.replace(/['"]+/g, "");
    }

    if (!prop) {
      cleanedEntry[lowerCaseName] = val;
      return;
    }

    const { collection } = prop;

    if (!collection && isArray) {
      const length = val.length;
      if (length > 0) {
        const expUrl = val[length - 1].content;
        const value = prop.resolve ? await resolveExp(expUrl) : expUrl;
        cleanedEntry[lowerCaseName] = value;
      } else {
        cleanedEntry[lowerCaseName] = null;
      }
    }

    if (collection && isArray) {
      cleanedEntry[lowerCaseName] = val.map((v) => v.content);
    }

    if (collection && !isArray) {
      cleanedEntry[lowerCaseName] = [];
    }

    if (!isArray && !collection) {
      cleanedEntry[lowerCaseName] = val;
    }
  });

  return cleanedEntry;
}

export function extractPrologResults(
  prologResults: any,
  values: string[]
): any[] {
  if (prologResults === null || prologResults === false) {
    return [];
  }
  if (!Array.isArray(prologResults)) {
    prologResults = [prologResults];
  }

  const results = [] as any[];

  for (const prologResult of prologResults) {
    const result = {};
    for (const value of values) {
      const prologResultValue = prologResult[value];

      if (!prologResultValue.head) {
        if (prologResultValue !== "[]" && !prologResultValue.variable) {
          result[value] = prologResultValue;
        } else {
          result[value] = [];
        }
      } else {
        const temp = [] as any[];
        const prologResultValueHead = prologResultValue.head;
        let prologResultValueTail = prologResultValue.tail;
        temp.push({
          content: prologResultValueHead.args[0],
          timestamp: new Date(prologResultValueHead.args[1].args[0]),
          author: prologResultValueHead.args[1].args[1],
        });
        while (typeof prologResultValueTail !== "string") {
          temp.push({
            content: prologResultValueTail.head.args[0],
            timestamp: new Date(prologResultValueTail.head.args[1].args[0]),
            author: prologResultValueTail.head.args[1].args[1],
          });
          prologResultValueTail = prologResultValueTail.tail;
        }
        result[value] = temp;
      }
    }
    results.push(result);
  }
  return results;
}
