import { useUserStore } from "@/store/user";
import { Pinia, createPinia, setActivePinia } from "pinia";
import initAgent from "../../../fixtures/initAgent.json";

describe("User Mutations", () => {
  let store: Pinia;

  beforeEach(() => {
    store = createPinia();
    setActivePinia(store);
  });

  test("Initial user store", () => {
    const userStore = useUserStore();
    const initialState = userStore;

    expect(initialState.profile).toBeNull();
    expect(initialState.agent).toStrictEqual({
      isInitialized: false,
      isUnlocked: false,
      did: "",
      didDocument: "",
    });
  });

  test("Update Agent Status", () => {
    const userStore = useUserStore();
    expect(userStore.agent).toStrictEqual({
      isInitialized: false,
      isUnlocked: false,
      did: "",
      didDocument: "",
    });

    userStore.updateAgentStatus(initAgent);

    expect(userStore.agent).toStrictEqual(initAgent);
  });

  test("Update Agent Lock State", () => {
    const userStore = useUserStore();
    expect(userStore.agent.isUnlocked).toBeFalsy();

    userStore.updateAgentLockState(true);

    expect(userStore.agent.isUnlocked).toBeTruthy();
  });

  test("Set User Profile", () => {
    const userStore = useUserStore();
    expect(userStore.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    userStore.setUserProfile(profile);

    expect(userStore.profile).not.toBeNull();
    expect(userStore.profile).toStrictEqual(profile);
  });
});
