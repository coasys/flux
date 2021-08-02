import community from "../../../fixtures/community.json";
import addChannelPerspective from "../../../fixtures/addChannelPerspective.json";
import addChannelUniqueHolochainLanguages from "../../../fixtures/addChannelUniqueHolochainLanguages.json";
import addChannelCreateLinkType from "../../../fixtures/addChannelCreateLinkType.json";
import addChannelCreateLink from "../../../fixtures/addChannelCreateLink.json";
import createChannelMeta from "../../../fixtures/createChannelMeta.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import * as addPerspective from "@/core/mutations/addPerspective";
import * as createUniqueHolochainLanguage from "@/core/mutations/createUniqueHolochainLanguage";
import * as createNeighbourhood from "@/core/mutations/createNeighbourhood";
import * as createNeighbourhoodMeta from "@/core/methods/createNeighbourhoodMeta";
import * as createLink from "@/core/mutations/createLink";

describe("Create Channel", () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(addPerspective, "addPerspective")
      // @ts-ignore
      .mockResolvedValue(addChannelPerspective);

    // @ts-ignore
    jest
      .spyOn(createUniqueHolochainLanguage, "createUniqueHolochainLanguage")
      .mockImplementation(async () => {
        return addChannelUniqueHolochainLanguages;
      });

    // @ts-ignore
    jest
      .spyOn(createNeighbourhood, "createNeighbourhood")
      .mockImplementation(async () => {
        return "neighbourhood://8421244696ef9042d51add6f4517ae9353d7a4374459f3f50d3bf6f324219e3a62ebd46ec1b688";
      });

    // @ts-ignore
    jest
      .spyOn(createNeighbourhoodMeta, "createNeighbourhoodMeta")
      .mockImplementation(async (name, desc, lang) => {
        return createChannelMeta;
      });

    // @ts-ignore
    jest
      .spyOn(createLink, "createLink")
      .mockImplementation(async (perspective, link) => {
        if (link.predicate === "rdf://type") {
          return addChannelCreateLinkType;
        }
        return addChannelCreateLink;
      });

    // @ts-ignore
    const directStore = createDirectStore({
      modules: {
        user,
        data,
        app,
      },
    });
    store = directStore.store;
  });

  test("Create channel for community that doesnt exist", async () => {
    expect(Object.keys(store.state.data.neighbourhoods).length).toBe(0);

    try {
      await store.dispatch.createChannel({
        communityId: community.state.perspectiveUuid,
        name: "test",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Community does not exists"
      );
    }

    expect(Object.keys(store.state.data.neighbourhoods).length).toBe(0);
  });

  test("Create channel for a community", async () => {
    expect(Object.keys(store.state.data.neighbourhoods).length).toBe(0);

    store.commit.addCommunity(community);

    const channel = await store.dispatch.createChannel({
      communityId: community.state.perspectiveUuid,
      name: "test",
    });

    expect(Object.keys(store.state.data.neighbourhoods).length).toBe(2);
    expect(
      Object.keys(store.state.data.neighbourhoods).find(
        (e) => e === channel.state.perspectiveUuid
      )
    ).toBe(channel.state.perspectiveUuid);
  });
});
