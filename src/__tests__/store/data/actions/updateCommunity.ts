import community from "../../../fixtures/community.json";
import updateCommunityLinkData from "../../../fixtures/updateCommunityLinkData.json";
import * as createExpression from "@/core/mutations/createExpression";
import * as createLink from "@/core/mutations/createLink";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";

describe("Update Community", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest.spyOn(createLink, "createLink").mockImplementation(async () => {
      return updateCommunityLinkData;
    });

    store = createPinia();
    setActivePinia(store);
  });

  test("Update Community with wrong community id", async () => {
    const dataStore = useDataStore();

    const tempCommuntiy = {
      ...community,
      neighbourhood: {
        ...community.neighbourhood,
        typedExpressionLanguages: [
          community.neighbourhood.typedExpressionLanguages[0],
          community.neighbourhood.typedExpressionLanguages[2],
        ],
      },
    };

    // @ts-ignore
    await dataStore.addCommunity(tempCommuntiy);

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");

    try {
      await dataStore.updateCommunity({
        communityId: community.state.perspectiveUuid,
        name: "hello",
        description: "hello",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        `Error: Expected to find group expression language for group`
      );
    }

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");
  });

  test("Update Community - Failure", async () => {
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");

    try {
      dataStore.updateCommunity({
        communityId: community.state.perspectiveUuid,
        name: "hello",
        description: "hello",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        `Error: Language not found by reference: {"address":"${community.neighbourhood.typedExpressionLanguages[1].languageAddress}"}`
      );
    }

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");
  });

  test("Update Community - Success", async () => {
    const dataStore = useDataStore();

    // @ts-ignore
    jest
      .spyOn(createExpression, "createExpression")
      .mockImplementation(async () => {
        return "QmVWescmAofwfXim3QNqhvQbPee4WfezCpgGFbkaEBZHJS://8429242a7888abe19e8e625e2b390eeae4bff429db7ef825f1791ea7d89ac4073356f6f3039aed";
      });

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");

    await dataStore.updateCommunity({
      communityId: community.state.perspectiveUuid,
      name: "hello",
      description: "hello",
    });

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "hello"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("hello");
  });
});
