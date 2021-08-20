import "@testing-library/vue";
import initAgentFixture from "../../../fixtures/initAgent.json";
import addPerspectiveFixture from "../../../fixtures/addPerspective.json";
import * as agentGenerate from "@/core/mutations/agentGenerate";
import * as addPerspective from "@/core/mutations/addPerspective";
import { AgentStatus, PerspectiveHandle } from "@perspect3vism/ad4m";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";

describe("Store Actions", () => {
  let store: Pinia;

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

    store = createPinia();
    setActivePinia(store);
  });

  test("Create User with all the property", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    await userStore.createUser({
      ...profile,
      password: "test123456",
    });

    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.did).toBe(initAgentFixture.did);
    expect(userStore.profile).not.toBeNull();
    expect(userStore.profile).toStrictEqual(profile);
  });

  test("Create User without password", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    try {
      await userStore.createUser({
        ...profile,
        password: "",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: No Password passed");
    }

    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isUnlocked).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();
  });
});
