import community from "../../../fixtures/community.json";
import createCommunityPerspective from "../../../fixtures/createCommunityPerspective.json";
import createCommunityUniqueHolochainLanguage from "../../../fixtures/createCommunityUniqueHolochainLanguage.json";
import createCommunityLinkType from "../../../fixtures/createCommunityLinkType.json";
import addChannelCreateLink from "../../../fixtures/addChannelCreateLink.json";
import createChannelMeta from "../../../fixtures/createChannelMeta.json";
import createCommunityGroupExpression from "../../../fixtures/createCommunityGroupExpression.json";
import createCommunityProfileLink from "../../../fixtures/createCommunityProfileLink.json";
import createCommunityChannel from "../../../fixtures/createCommunityChannel.json";
import languages from "../../../fixtures/languages.json";
import * as addPerspective from "@/core/mutations/addPerspective";
import * as templateLanguage from "@/core/mutations/templateLanguage";
import * as createNeighbourhood from "@/core/mutations/createNeighbourhood";
import * as createNeighbourhoodMeta from "@/core/methods/createNeighbourhoodMeta";
import * as createLink from "@/core/mutations/createLink";
import * as createExpression from "@/core/mutations/createExpression";
import * as createProfile from "@/core/methods/createProfile";
import * as createChannel from "@/core/methods/createChannel";
import * as getLanguage from "@/core/queries/getLanguage";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";
import {
  GROUP_EXPRESSION_OFFICIAL,
  SHORTFORM_EXPRESSION_OFFICIAL,
  SOCIAL_CONTEXT_OFFICIAL,
} from "@/ad4m-globals";

describe("Create Community", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(addPerspective, "addPerspective")
      // @ts-ignore
      .mockResolvedValue(createCommunityPerspective);

    // @ts-ignore
    jest
      .spyOn(templateLanguage, "templateLanguage")
      .mockImplementation(async (sourceLanguageHash, templateData) => {
        if (sourceLanguageHash === SOCIAL_CONTEXT_OFFICIAL) {
          return createCommunityUniqueHolochainLanguage[0];
        } else if (sourceLanguageHash === SHORTFORM_EXPRESSION_OFFICIAL) {
          return createCommunityUniqueHolochainLanguage[1];
        } else if (sourceLanguageHash === GROUP_EXPRESSION_OFFICIAL) {
          return createCommunityUniqueHolochainLanguage[2];
        }
        return createCommunityUniqueHolochainLanguage[3];
      });

    // @ts-ignore
    jest
      .spyOn(createNeighbourhood, "createNeighbourhood")
      .mockImplementation(async () => {
        return "neighbourhood://QmW6LEDuWFuRPBgWsaeh3D9KpjVLu3PZ7VeeV2WYATTJop";
      });

    // @ts-ignore
    jest
      .spyOn(getLanguage, "getLanguage")
      // @ts-ignore
      .mockResolvedValue(languages[0]);

    // @ts-ignore
    jest
      .spyOn(createNeighbourhoodMeta, "createNeighbourhoodMeta")
      .mockImplementation(async (name, desc, lang) => {
        return createChannelMeta;
      });

    // @ts-ignore
    jest
      .spyOn(createExpression, "createExpression")
      .mockImplementation(async () => {
        return "QmbhWYKXXa53H5hSEsPEuQ9FJL1dBurBNkRF2391gsL9DV://842924554879604b2130319f6cabb23e24ce4438ec52995ee322b91a934d7813ed34c344b0ee54";
      });

    // @ts-ignore
    jest.spyOn(createProfile, "createProfile").mockImplementation(async () => {
      return "QmUbmDdBMpv2vWa2kXPxcmcUtArLwAHQQgqvJ4XuDBfhtX://did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW";
    });

    // @ts-ignore
    jest
      .spyOn(createChannel, "createChannel")
      // @ts-ignore
      .mockResolvedValue(createCommunityChannel);

    // @ts-ignore
    jest
      .spyOn(createLink, "createLink")
      .mockImplementation(async (perspective, link) => {
        if (link.predicate === "rdf://type") {
          return createCommunityLinkType;
        } else if (link.predicate === "rdf://class") {
          return createCommunityGroupExpression;
        } else if (link.predicate === "sioc://has_member") {
          return createCommunityProfileLink;
        }
        return addChannelCreateLink;
      });

    store = createPinia();
    setActivePinia(store);
  });

  test("Create Community - Success", async () => {
    const dataStore = useDataStore();

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    await dataStore.createCommunity({
      perspectiveName: "aaaaaaaaaaa",
      description: "",
    });

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(1);
    expect(Object.keys(dataStore.neighbourhoods)).toStrictEqual([
      "9cac577c-0b0a-44f4-9d4f-66edcc236021",
    ]);
  });

  test("Create Community - Failure", async () => {
    const dataStore = useDataStore();

    // @ts-ignore
    jest
      .spyOn(addPerspective, "addPerspective")
      // @ts-ignore
      .mockRejectedValue(Error("Could not create Perspective"));

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    try {
      await dataStore.createCommunity({
        perspectiveName: "aaaaaaaaaaa",
        description: "",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Could not create Perspective"
      );
    }

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);
  });
});
