import "@testing-library/vue";
import initAgentFixture from "../../fixtures/initAgent.json";
import addPerspectiveFixture from "../../fixtures/addPerspective.json";
import { createStore, Store } from "vuex";
import mutations from "@/store/mutations";
import actions from "@/store/actions";
import getters from "@/store/getters";
import { State } from "@/store";
import { agentGenerate } from "../../../core/mutations/agentGenerate";
import { addPerspective } from "../../../core/mutations/addPerspective";
import { AgentStatus, PerspectiveHandle } from "@perspect3vism/ad4m-types";
import createUser from "@/store/actions/createUser";

describe("Store Actions", () => {
  let store: Store<State>;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(agentGenerate, "agentGenerate")
      .mockResolvedValue(initAgentFixture as AgentStatus);

    // @ts-ignore
    // jest.spyOn(lockAgent, "lockAgent").mockImplementation(async (password) => {
    //   if (password) {
    //     return lockAgentFixture as AgentStatus;
    //   } else {
    //     throw Error("No Password passed");
    //   }
    // });

    // @ts-ignore
    jest
      .spyOn(addPerspective, "addPerspective")
      .mockResolvedValue(addPerspectiveFixture as PerspectiveHandle);

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
