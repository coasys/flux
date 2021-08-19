import "@testing-library/vue";
import community from "../../../fixtures/community.json";
import * as getLinks from "../../../../core/queries/getLinks";
import getCommunityMembersLinkFixture from "../../../fixtures/getCommunityMembersLink.json";
import getProfileFixture from "../../../fixtures/getProfile.json";
import * as getExpressionNoCache from "@/core/queries/getExpression";
import { Expression } from "@perspect3vism/ad4m";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";

describe("Get Community Members", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(getLinks, "getLinks")
      // @ts-ignore
      .mockResolvedValue(getCommunityMembersLinkFixture);

    // @ts-ignore
    jest
      .spyOn(getExpressionNoCache, "getExpressionNoCache")
      .mockImplementation(async (url) => {
        return getProfileFixture as unknown as Expression;
      });

    store = createPinia();
    setActivePinia(store);
  });

  test("Check if the getNeighbourhoodMembers work", async () => {
    const dataStore = useDataStore();
    
    // @ts-ignore
    dataStore.addCommunity(community);
    const communityId = community.neighbourhood.perspective.uuid;
    expect(dataStore.neighbourhoods[communityId].members).toStrictEqual(
      []
    );

    await dataStore.getNeighbourhoodMembers(communityId);

    expect(dataStore.neighbourhoods[communityId].members.length).toBe(1);
  });

  test("Check if the getNeighbourhoodMembers with wrong community id or community that don't exists", async () => {
    const dataStore = useDataStore();

    const communityId = community.neighbourhood.perspective.uuid;

    try {
      await dataStore.getNeighbourhoodMembers(`${communityId}1`);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "TypeError: Cannot read property 'neighbourhoodUrl' of undefined"
      );
    }
  });
});
