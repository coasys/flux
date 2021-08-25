import "@testing-library/vue";
import * as agentUnlock from "../../../../core/mutations/agentUnlock";
import lockAgentFixture from "../../../fixtures/lockAgent.json";
import { AgentStatus } from "@perspect3vism/ad4m";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";

describe("Login", () => {
  let store: Pinia;

  beforeEach(() => {
    store = createPinia();
    setActivePinia(store);

    jest
      .spyOn(agentUnlock, "agentUnlock")
      .mockImplementation(async (password) => {
        if (password === "test123") {
          return lockAgentFixture as AgentStatus;
        }

        throw new Error("Password doesn't match");
      });
  });

  test("Login with wrong password", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isUnlocked).toBeFalsy();
    expect(userStore.agent.did).toBe("");

    try {
      await userStore.logIn({
        password: "test1",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: Password doesn't match");
    }

    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isUnlocked).toBeFalsy();
    expect(userStore.agent.did).toBe("");
  });

  test("Login with correct password", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isUnlocked).toBeFalsy();

    await userStore.logIn({
      password: "test123",
    });

    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.isUnlocked).toBeTruthy();
  });
});
