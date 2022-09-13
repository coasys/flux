import { LinkQuery, Perspective, LinkInput } from "@perspect3vism/ad4m";
import { typeDefsString } from "@perspect3vism/ad4m";
import {
  PERSPECTIVE_LINK_QUERY,
  GET_EXPRESSION,
  GET_MANY_EXPRESSION,
} from "../core/graphql_queries";
import EasyGraphQLTester from "easygraphql-tester";
import { DocumentNode } from "graphql";

const tester = new EasyGraphQLTester(typeDefsString);

function getGqlString(doc: DocumentNode) {
  return doc.loc && doc.loc.source.body;
}

const linkInput = new LinkInput();
linkInput.source = "src";
linkInput.target = "target";

describe("GraphQL schema correctness", () => {
  test("Test queries", async () => {
    tester.test(true, getGqlString(PERSPECTIVE_LINK_QUERY), {
      uuid: "uuid",
      query: new LinkQuery({ source: "src" }),
    });
    tester.test(true, getGqlString(PERSPECTIVE_LINK_QUERY), {
      uuid: "uuid",
      query: new LinkQuery({ target: "tgt" }),
    });
    tester.test(true, getGqlString(PERSPECTIVE_LINK_QUERY), {
      uuid: "uuid",
      query: new LinkQuery({ predicate: "pdc" }),
    });
    tester.test(true, getGqlString(PERSPECTIVE_LINK_QUERY), {
      uuid: "uuid",
      query: new LinkQuery({ source: "src" }),
    });
    tester.test(true, getGqlString(PERSPECTIVE_LINK_QUERY), {
      uuid: "uuid",
      query: new LinkQuery({
        source: "src",
        fromDate: new Date(),
        untilDate: new Date(),
      }),
    });
    tester.test(true, getGqlString(GET_EXPRESSION), { url: "lang://expr" });
    tester.test(true, getGqlString(GET_MANY_EXPRESSION), {
      urls: ["lang://expr"],
    });
  });
});
