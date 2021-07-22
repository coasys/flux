import { State } from "@/store/types";
import actions from "@/store/actions";
import getters from "@/store/getters";
import mutations from "@/store/mutations";
import { AgentStatus } from "@perspect3vism/ad4m-types";
import { Store, createStore } from "vuex";
import * as agentUnlock from "../../../core/mutations/agentUnlock";
import lockAgentFixture from "../../fixtures/lockAgent.json";

describe("Login", () => {
  let store: Store<State>;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(agentUnlock, "agentUnlock")
      .mockImplementation(async (password) => {
        if (password === "test123") {
          return lockAgentFixture as AgentStatus;
        }

        throw new Error("Password doesn't match");
      });

    store = createStore({
      state: {
        ui: {
          modals: {
            showCreateCommunity: false,
            showEditCommunity: false,
            showCommunityMembers: false,
            showCreateChannel: false,
            showEditProfile: false,
            showSettings: false,
            showInviteCode: false,
            showDisclaimer: false,
          },
          showSidebar: true,
          showGlobalLoading: false,
          theme: {
            fontFamily: "default",
            name: "",
            hue: 270,
            saturation: 50,
            fontSize: "md",
          },
          toast: {
            variant: "",
            message: "",
            open: false,
          },
          globalError: {
            show: false,
            message: "",
          },
        },
        communities: {},
        localLanguagesPath: "",
        databasePerspective: "",
        applicationStartTime: new Date(),
        expressionUI: {},
        agentUnlocked: false,
        agentInit: false,
        userProfile: null,
        updateState: "not-available",
        userDid: "",
        windowState: "visible",
      },
      mutations: mutations,
      actions: actions,
      getters: getters,
    });
  });

  test("Login with wrong password", async () => {
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.userDid).toBe("");

    try {
      await store.dispatch("logIn", {
        password: "test1",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: Password doesn't match");
    }

    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.userDid).toBe("");
  });

  test("Login with correct password", async () => {
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.agentInit).toBeFalsy();

    await store.dispatch("logIn", {
      password: "test123",
    });

    expect(store.state.agentInit).toBeTruthy();
    expect(store.state.agentInit).toBeTruthy();
  });
});
