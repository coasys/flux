import "@testing-library/vue";
import community from "../../../fixtures/community.json";
import * as getLinks from "../../../../core/queries/getLinks";
import getCommunityMembersLinkFixture from "../../../fixtures/getCommunityMembersLink.json";
import getProfileFixture from "../../../fixtures/getProfile.json";
import * as getExpressionNoCache from "@/core/queries/getExpression";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import { Expression } from "@perspect3vism/ad4m";

describe("Get Community Members", () => {
  let store: any;

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

    // @ts-ignore
    const directStore = createDirectStore({
      modules: {
        user,
        data,
        app,
      },
    });
    store = directStore.store; //createStore(tempStore);
  });

  test("Check if the getNeighbourhoodMembers work", async () => {
    store.commit.addCommunity(community);
    const communityId = community.neighbourhood.perspective.uuid;
    expect(store.state.data.neighbourhoods[communityId].members).toStrictEqual(
      []
    );

    await store.dispatch.getNeighbourhoodMembers(communityId);

    expect(store.state.data.neighbourhoods[communityId].members.length).toBe(1);
  });

  test("Check if the getNeighbourhoodMembers with wrong community id or community that don't exists", async () => {
    const communityId = community.neighbourhood.perspective.uuid;

    try {
      await store.dispatch.getNeighbourhoodMembers(`${communityId}1`);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "TypeError: Cannot read property 'neighbourhoodUrl' of undefined"
      );
    }
  });
});
