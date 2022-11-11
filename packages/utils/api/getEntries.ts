import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import extractPrologResults from "../helpers/extractPrologResults";
import { GetEntries, Entry } from "../types";

//usage: format("Hello %%! I ate %% apples today.", "World", 44);
//@ts-ignore
function format(fmt, ...args){
    return fmt
        .split("%%")
        .reduce((aggregate, chunk, i) =>
            aggregate + chunk + (args[i] || ""), "");
}

export default async function getEntries(input: GetEntries): Promise<Entry[]> {
    const client = await getAd4mClient();
    const entries = [];
    for (const query of input.queries) {
        const prologQuery = format(query.query, ...query.arguments);
        const prologResult = await client.perspective.queryProlog(input.perspectiveUuid, prologQuery);
        const cleanedPrologResult = await extractPrologResults(prologResult, query.resultKeys);
        console.log("Got cleaned prolog result", cleanedPrologResult);
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
        }
    }
    
    return entries;
}