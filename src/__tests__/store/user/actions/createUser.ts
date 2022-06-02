import initAgentFixture from "../../../fixtures/initAgent.json";
import addPerspectiveFixture from "../../../fixtures/addPerspective.json";
import { AgentStatus, PerspectiveHandle } from "@perspect3vism/ad4m";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";
import { ad4mClient } from "@/app";

describe("Store Actions", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.agent, "generate")
      .mockImplementation(async (password) => {
        if (password) {
          return initAgentFixture as AgentStatus;
        } else {
          throw Error("No Password passed");
        }
      });

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "add")
      // @ts-ignore
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
