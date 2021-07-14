import "@testing-library/vue";
import initAgentFixture from "../../fixtures/initAgent.json";
import lockAgentFixture from "../../fixtures/lockAgent.json";
import addPerspectiveFixture from "../../fixtures/addPerspective.json";
import { createStore, Store } from "vuex";
import mutations from "@/store/mutations";
import actions from "@/store/actions";
import getters from "@/store/getters";
import { State } from "@/store";
import * as initAgent from "../../../core/mutations/agentGenerate";
import * as lockAgent from "../../../core/mutations/lockAgent";
import * as addPerspective from "../../../core/mutations/addPerspective";
import { AgentService, Perspective } from "@perspect3vism/ad4m-executor";
import createUser from "@/store/actions/createUser";

describe("Store Actions", () => {
  let store: Store<State>;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(initAgent, "initAgent")
      .mockResolvedValue(initAgentFixture as AgentService);

    // @ts-ignore
    jest.spyOn(lockAgent, "lockAgent").mockImplementation(async (password) => {
      if (password) {
        return lockAgentFixture as AgentService;
      } else {
        throw Error("No Password passed");
      }
    });

    // @ts-ignore
    jest
      .spyOn(addPerspective, "addPerspective")
      .mockResolvedValue(addPerspectiveFixture as Perspective);

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
          },
          showSidebar: true,
          showGlobalLoading: false,
          theme: {
            fontFamily: "default",
            name: "",
            hue: 270,
            saturation: 50,
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

  test("Create User with all the property", async () => {
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.userDid).toBe("");
    expect(store.state.userProfile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    await store.dispatch("createUser", {
      ...profile,
      password: "test123456",
    });

    expect(store.state.agentInit).toBeTruthy();
    expect(store.state.agentInit).toBeTruthy();
    expect(store.state.userDid).toBe(initAgentFixture.did);
    expect(store.state.userProfile).not.toBeNull();
    expect(store.state.userProfile).toStrictEqual(profile);
  });

  test("Create User without password", async () => {
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.userDid).toBe("");
    expect(store.state.userProfile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    try {
      await createUser(
        { commit: store.commit },
        {
          ...profile,
          password: "",
        }
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: No Password passed");
    }

    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.agentInit).toBeFalsy();
    expect(store.state.userDid).toBe("");
    expect(store.state.userProfile).toBeNull();
  });
});
