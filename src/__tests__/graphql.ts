import {
  LinkQuery,
  Perspective,
  LinkInput,
} from "@perspect3vism/ad4m-types";
import { typeDefsString } from "@perspect3vism/ad4m";
import {
  OPEN_LINK,
  QUIT,
  AGENT_STATUS,
  AGENT,
  AGENT_GENERATE,
  AGENT_LOCK,
  AGENT_UNLOCK,
  AGENT_UPDATE_PUBLIC_PERSPECTIVE,
  AGENT_UPDATE_DIRECT_MESSAGE_ADAPTER,
  LANGUAGES,
  LANGUAGES_WRITE_SETTINGS,
  PERSPECTIVE,
  PERSPECTIVES,
  PERSPECTIVE_SNAPSHOT,
  PERSPECTIVE_ADD,
  PERSPECTIVE_UPDATE,
  PUBLISH_NEIGHBOURHOOD_FROM_PERSPECTIVE,
  LANGUAGE_CLONE_HOLOCHAIN_TEMPLATE,
  PERSPECTIVE_REMOVE,
  PERSPECTIVE_ADDED,
  PERSPECTIVE_UPDATED,
  PERSPECTIVE_REMOVED,
  PERSPECTIVE_LINK_QUERY,
  ADD_LINK,
  CREATE_EXPRESSION,
  GET_EXPRESSION,
  LANGUAGE,
  NEIGHBOURHOOD_JOIN,
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
    tester.test(true, getGqlString(OPEN_LINK), { url: "url" });
    tester.test(true, getGqlString(QUIT));
    tester.test(true, getGqlString(AGENT_STATUS));
    tester.test(true, getGqlString(AGENT));
    tester.test(true, getGqlString(AGENT_GENERATE), {
      passphrase: "passphrase",
    });
    tester.test(true, getGqlString(AGENT_LOCK), { passphrase: "passphrase" });
    tester.test(true, getGqlString(AGENT_UNLOCK), { passphrase: "passphrase" });
    tester.test(true, getGqlString(AGENT_UPDATE_PUBLIC_PERSPECTIVE), {
      perspective: new Perspective(),
    });
    tester.test(true, getGqlString(AGENT_UPDATE_DIRECT_MESSAGE_ADAPTER), {
      directMessageLanguage: "langlang://lang",
    });
    tester.test(true, getGqlString(LANGUAGES), { filter: "" });
    tester.test(true, getGqlString(LANGUAGE), { address: "addr" });
    tester.test(true, getGqlString(LANGUAGES_WRITE_SETTINGS), {
      languageAddress: "",
      settings: JSON.stringify({}),
    });
    tester.test(true, getGqlString(PERSPECTIVE), { uuid: "uuid" });
    tester.test(true, getGqlString(PERSPECTIVES));
    tester.test(true, getGqlString(PERSPECTIVE_SNAPSHOT), { uuid: "uuid" });
    tester.test(true, getGqlString(PERSPECTIVE_ADD), {
      name: "new perspective",
    });
    tester.test(true, getGqlString(PERSPECTIVE_UPDATE), {
      uuid: "uuid",
      name: "new perspective",
    });
    tester.test(true, getGqlString(PUBLISH_NEIGHBOURHOOD_FROM_PERSPECTIVE), {
      perspectiveUUID: "uuid",
      meta: new Perspective(),
      linkLanguage: "linklang",
    });
    tester.test(true, getGqlString(LANGUAGE_CLONE_HOLOCHAIN_TEMPLATE), {
      languagePath: "path",
      dnaNick: "nick.dna",
      uid: "uid",
    });
    tester.test(true, getGqlString(PERSPECTIVE_REMOVE), { uuid: "uuid" });
    tester.test(true, getGqlString(PERSPECTIVE_ADDED));
    tester.test(true, getGqlString(PERSPECTIVE_UPDATED));
    tester.test(true, getGqlString(PERSPECTIVE_REMOVED));
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
    tester.test(true, getGqlString(ADD_LINK), {
      uuid: "uuid",
      link: linkInput,
    });
    tester.test(true, getGqlString(CREATE_EXPRESSION), {
      content: "content",
      languageAddress: "exp-lang",
    });
    tester.test(true, getGqlString(GET_EXPRESSION), { url: "lang://expr" });
    tester.test(true, getGqlString(NEIGHBOURHOOD_JOIN), {
      url: "neighbourhood",
    });
  });
});
