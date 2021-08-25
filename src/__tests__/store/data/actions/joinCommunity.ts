import community from "../../../fixtures/community.json";
import joinNeighbourhoodFixture from "../../../fixtures/joinNeighbourhood.json";
import createCommunityProfileLink from "../../../fixtures/createCommunityProfileLink.json";
import joinComunityExpressionTypes from "../../../fixtures/joinComunityExpressionTypes.json";
import addChannelCreateLink from "../../../fixtures/addChannelCreateLink.json";
import * as joinNeighbourhood from "@/core/mutations/joinNeighbourhood";
import * as getTypedExpressionLanguages from "@/core/methods/getTypedExpressionLangs";
import * as createProfile from "@/core/methods/createProfile";
import * as createLink from "@/core/mutations/createLink";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";

// TODO: @fayeed - Add a timeout error if the joincode is wrong.
describe("Join Community", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(joinNeighbourhood, "joinNeighbourhood")
      // @ts-ignore
      .mockResolvedValue(joinNeighbourhoodFixture);

    // @ts-ignore
    jest
      .spyOn(getTypedExpressionLanguages, "getTypedExpressionLanguages")
      // @ts-ignore
      .mockImplementation(async () => {
        return joinComunityExpressionTypes;
      });

    // @ts-ignore
    jest.spyOn(createProfile, "createProfile").mockImplementation(async () => {
      return "QmUbmDdBMpv2vWa2kXPxcmcUtArLwAHQQgqvJ4XuDBfhtX://did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW";
    });

    // @ts-ignore
    jest
      .spyOn(createLink, "createLink")
      .mockImplementation(async (perspective, link) => {
        if (link.predicate === "sioc://has_member") {
          return createCommunityProfileLink;
        }
        return addChannelCreateLink;
      });

    store = createPinia();
    setActivePinia(store);
  });

  test("Joining a Community that you are already part of should throw an error", async () => {
    const dataStore = useDataStore();
    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(1);

    try {
      await dataStore.joinCommunity({
        joiningLink:
          "neighbourhood://842124fcb0f01904452d3fda10cf547519e8dc5ef679c66837f4ef9db70cd937b14203b9da1b9b",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: You are already part of this group"
      );
    }

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(1);
  });

  test("Join Community - Success", async () => {
    const dataStore = useDataStore();

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    await dataStore.joinCommunity({
      joiningLink:
        "neighbourhood://842124fcb0f01904452d3fda10cf547519e8dc5ef679c66837f4ef9db70cd937b14203b9da1b9b",
    });

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(1);
  });

  test("Join Community - Failure", async () => {
    const dataStore = useDataStore();

    // @ts-ignore
    jest
      .spyOn(joinNeighbourhood, "joinNeighbourhood")
      // @ts-ignore
      .mockRejectedValue(Error("No neighbourhood found"));

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    try {
      await dataStore.joinCommunity({
        joiningLink:
          "neighbourhood://842124fcb0f01904452d3fda10cf547519e8dc5ef679c66837f4ef9db70cd937b14203b9da1b9b",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: No neighbourhood found");
    }

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);
  });
});
