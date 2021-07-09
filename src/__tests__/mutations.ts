import "@testing-library/vue";
// import store from '../store';
import community from "./fixtures/community.json";
import channel from "./fixtures/channel.json";
import { createStore, Store } from "vuex";
import mutations from "@/store/mutations";
import actions from "@/store/actions";
import getters from "@/store/getters";
import { State } from "@/store";

describe("Store Mutations", async () => {
  let store: Store<State>;

  beforeEach(() => {
    // store.commit('resetState');
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

  test("Add Community", async () => {
    expect(Object.values(store.state.communities).length).toBe(0);

    store.commit("addCommunity", community);

    expect(Object.values(store.state.communities).length).toBe(1);

    expect(Object.values(store.state.communities)[0].perspective).toBe(
      community.perspective
    );
  });

  test("Add Channel", async () => {
    expect(Object.values(store.state.communities).length).toBe(0);

    store.commit("addCommunity", community);

    expect(Object.values(store.state.communities).length).toBe(1);

    expect(Object.values(store.state.communities)[0].perspective).toBe(
      community.perspective
    );

    expect(
      Object.values(store.state.communities[community.perspective].channels)
        .length
    ).toBe(1);

    store.commit("addChannel", {
      communityId: community.perspective,
      channel,
    });

    expect(
      Object.values(store.state.communities[community.perspective].channels)
        .length
    ).toBe(2);
  });
});
