import community from "../../../fixtures/community.json";
import updateCommunityLinkData from "../../../fixtures/updateCommunityLinkData.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import * as createExpression from "@/core/mutations/createExpression";
import * as createLink from "@/core/mutations/createLink";

describe('Update Community', () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    jest
    .spyOn(createLink, "createLink")
      .mockImplementation(async () => {
        return updateCommunityLinkData;
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

  test('Update Community with wrong community id', async () => {
    const tempCommuntiy = {
      ...community,
      neighbourhood: {
        ...community.neighbourhood,
        typedExpressionLanguages: [
          community.neighbourhood.typedExpressionLanguages[0],
          community.neighbourhood.typedExpressionLanguages[2],
        ]
      }
    }

    await store.commit.addCommunity(tempCommuntiy);

    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].name).toBe("test");
    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].description).toBe("");

    try {
      await store.dispatch.updateCommunity({
        communityId: community.state.perspectiveUuid,
        name: 'hello',
        description: 'hello',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", `Error: Expected to find group expression language for group`);
    }

    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].name).toBe("test");
    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].description).toBe("");
  });

  test('Update Community - Failure', async () => {
    await store.commit.addCommunity(community);

    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].name).toBe("test");
    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].description).toBe("");

    try {
      store.dispatch.updateCommunity({
        communityId: community.state.perspectiveUuid,
        name: 'hello',
        description: 'hello',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", `Error: Language not found by reference: {\"address\":\"${community.neighbourhood.typedExpressionLanguages[1].languageAddress}\"}`);
    }

    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].name).toBe("test");
    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].description).toBe("");
  });

  test('Update Community - Success', async () => {
    // @ts-ignore
    jest
    .spyOn(createExpression, "createExpression")
    .mockImplementation(async () => {
      return "QmVWescmAofwfXim3QNqhvQbPee4WfezCpgGFbkaEBZHJS://8429242a7888abe19e8e625e2b390eeae4bff429db7ef825f1791ea7d89ac4073356f6f3039aed";
    });

    store.commit.addCommunity(community);

    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].name).toBe("test");
    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].description).toBe("");


    await store.dispatch.updateCommunity({
      communityId: community.state.perspectiveUuid,
      name: 'hello',
      description: 'hello',
    });

    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].name).toBe("hello");
    expect(store.state.data.neighbourhoods[community.state.perspectiveUuid].description).toBe("hello");
  });
});