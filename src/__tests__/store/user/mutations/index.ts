import app from "@/store/app";
import initAgent from "../../../fixtures/initAgent.json";
import user from "@/store/user";
import data from "@/store/data";
import { createDirectStore } from "direct-vuex";

describe("User Mutations", () => {
  let store: any;

  beforeEach(() => {
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

  test("Initial user store", () => {
    const initialState = store.state.user;

    expect(initialState.profile).toBeNull();
    expect(initialState.agent).toStrictEqual({
      isInitialized: false,
      isUnlocked: false,
      did: "",
      didDocument: "",
    });
  });

  test("Update Agent Status", () => {
    expect(store.state.user.agent).toStrictEqual({
      isInitialized: false,
      isUnlocked: false,
      did: "",
      didDocument: "",
    });

    store.commit.updateAgentStatus(initAgent);

    expect(store.state.user.agent).toStrictEqual(initAgent);
  });

  test("Update Agent Lock State", () => {
    expect(store.state.user.agent.isUnlocked).toBeFalsy();

    store.commit.updateAgentLockState(true);

    expect(store.state.user.agent.isUnlocked).toBeTruthy();
  });

  test("Set User Profile", () => {
    expect(store.state.user.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    store.commit.setUserProfile(profile);

    expect(store.state.user.profile).not.toBeNull();
    expect(store.state.user.profile).toStrictEqual(profile);
  });
});
