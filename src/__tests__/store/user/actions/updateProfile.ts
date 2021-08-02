import community from "../../../fixtures/community.json";
import * as getExpression from "../../../../core/queries/getExpression";
import getProfileFixture from "../../../fixtures/updateProfile.json";
import * as createProfile from "@/core/methods/createProfile";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";

describe("Update Profile", () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(getExpression, "getExpression")
      // @ts-ignore
      .mockResolvedValue(getProfileFixture);

    // @ts-ignore
    jest.spyOn(createProfile, "createProfile").mockImplementation(async () => {
      return "QmevBs9ztZwyZjseMD4X18zSHFuDp9eEaLJyirHazQWmxS://did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW";
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

  test("Update Profile - Success", () => {
    store.commit.addCommunity(community);

    expect(store.state.user.profile).toBeNull();

    store.dispatch.updateProfile({
      username: "jhon_doe",
    });

    expect(store.state.user.profile.username).toBe("jhon_doe");
  });

  test("Update Profile - Failure", async () => {
    // @ts-ignore
    jest
      .spyOn(createProfile, "createProfile")
      .mockRejectedValue(Error("Could not create new profile exp"));

    store.commit.addCommunity(community);

    expect(store.state.user.profile).toBeNull();

    try {
      await store.dispatch.updateProfile({
        username: "jhon_doe",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Could not create new profile exp"
      );
    }

    expect(store.state.user.profile.username).toBe("jhon_doe");
  });
});
