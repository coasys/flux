import community from "../../../fixtures/community.json";
import * as getExpression from "../../../../core/queries/getExpression";
import getProfileFixture from "../../../fixtures/updateProfile.json";
import * as createProfile from "@/core/methods/createProfile";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";
import { useDataStore } from "@/store/data";

describe("Update Profile", () => {
  let store: Pinia;

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

    store = createPinia();
    setActivePinia(store);
  });

  test("Update Profile - Success", () => {
    const userStore = useUserStore();
    const dataStore = useDataStore();

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(userStore.profile).toBeNull();

    userStore.updateProfile({
      username: "jhon_doe",
    });

    expect(userStore.profile!.username).toBe("jhon_doe");
  });

  test("Update Profile - Failure", async () => {
    const userStore = useUserStore();
    const dataStore = useDataStore();

    // @ts-ignore
    jest
      .spyOn(createProfile, "createProfile")
      .mockRejectedValue(Error("Could not create new profile exp"));

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(userStore.profile).toBeNull();

    try {
      await userStore.updateProfile({
        username: "jhon_doe",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Could not create new profile exp"
      );
    }

    expect(userStore.profile!.username).toBe("jhon_doe");
  });
});
