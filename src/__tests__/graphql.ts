import { typeDefsString } from "@perspect3vism/ad4m"
import * as InternalQueries from "../core/graphql_queries";
const EasyGraphQLTester = require("easygraphql-tester");
import { DocumentNode } from "graphql";

console.log("testing with", typeDefsString);

const tester = new EasyGraphQLTester(typeDefsString)

function getGqlString(doc: DocumentNode) {
    return doc.loc && doc.loc.source.body;
}

describe("GraphQL schema correctness", async () => {
    test("Test queries", async () => {
        console.warn(InternalQueries);
        //@ts-ignore
        for (const query of Object.values(InternalQueries)) {
            console.log(getGqlString(query));
            tester.test(true, getGqlString(query), {url: "url"});
        }
    });
})