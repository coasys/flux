import "@testing-library/vue";
import * as agentUnlock from "../../../../core/mutations/agentUnlock";
import lockAgentFixture from "../../../fixtures/lockAgent.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import { AgentStatus } from "@perspect3vism/ad4m";
// import { AppStore } from "@/store";

describe("Login", () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    // @ts-ignore
    const directStore = createDirectStore({
      modules: {
        user,
        data,
        app,
      },
    });
    store = directStore.store; //createStore(tempStore);
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
    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.isUnlocked).toBeFalsy();
    expect(store.state.user.agent.did).toBe("");

    try {
      await store.dispatch.logIn({
        password: "test1",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: Password doesn't match");
    }

    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.isUnlocked).toBeFalsy();
    expect(store.state.user.agent.did).toBe("");
  });

  test("Login with correct password", async () => {
    expect(store.state.user.agent.isInitialized).toBeFalsy();
    expect(store.state.user.agent.isUnlocked).toBeFalsy();

    await store.dispatch.logIn({
      password: "test123",
    });

    expect(store.state.user.agent.isInitialized).toBeTruthy();
    expect(store.state.user.agent.isUnlocked).toBeTruthy();
  });
});
