import "@testing-library/vue";
import initAgentFixture from "../../../fixtures/initAgent.json";
import addPerspectiveFixture from "../../../fixtures/addPerspective.json";
import * as agentGenerate from "@/core/mutations/agentGenerate";
import * as addPerspective from "@/core/mutations/addPerspective";
import user from "@/store/user";
import { createDirectStore } from "direct-vuex";
import data from "@/store/data";
import app from "@/store/app";
import { AgentStatus, PerspectiveHandle } from "@perspect3vism/ad4m";

describe("Store Actions", () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(agentGenerate, "agentGenerate")
      .mockImplementation(async (password) => {
        if (password) {
          return initAgentFixture as AgentStatus;
        } else {
          throw Error("No Password passed");
        }
      });

    // @ts-ignore
    jest
      .spyOn(addPerspective, "addPerspective")
      .mockResolvedValue(addPerspectiveFixture as PerspectiveHandle);

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

  test("Create User with all the property", async () => {
    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.did).toBe("");
    expect(store.state.user.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    await store.dispatch.createUser({
      ...profile,
      password: "test123456",
    });

    expect(store.state.user.agent.isInitialized).toBeTruthy();
    expect(store.state.user.agent.isInitialized).toBeTruthy();
    expect(store.state.user.agent.did).toBe(initAgentFixture.did);
    expect(store.state.user.profile).not.toBeNull();
    expect(store.state.user.profile).toStrictEqual(profile);
  });

  test("Create User without password", async () => {
    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.did).toBe("");
    expect(store.state.user.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    try {
      await store.dispatch.createUser({
        ...profile,
        password: "",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: No Password passed");
    }

    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.isUnlocked).toBeFalsy();
    expect(store.state.user.agent.did).toBe("");
    expect(store.state.user.profile).toBeNull();
  });
});
