import "@testing-library/vue";
// import store from '../store';
import community from "./fixtures/community.json";
import channel from "./fixtures/channel.json";
import { createStore, Store } from "vuex";
import mutations from "@/store/mutations";
import actions from "@/store/actions";
import getters from "@/store/getters";
import { State } from "@/store/types";

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

    expect(Object.values(store.state.communities)[0].perspective.uuid).toBe(
      community.perspective.uuid
    );
  });

  test("Check duplicate community if one exists already", async () => {
    expect(Object.values(store.state.communities).length).toBe(0);

    store.commit("addCommunity", community);

    expect(Object.keys(store.state.communities)).toStrictEqual([
      community.perspective.uuid,
    ]);

    store.commit("addCommunity", community);

    expect(Object.keys(store.state.communities)).toStrictEqual([
      community.perspective.uuid,
    ]);
  });

  test("Add Channel", async () => {
    expect(Object.values(store.state.communities).length).toBe(0);

    store.commit("addCommunity", community);

    expect(Object.values(store.state.communities).length).toBe(1);

    expect(Object.values(store.state.communities)[0].perspective.uuid).toBe(
      community.perspective.uuid
    );

    expect(
      Object.values(
        store.state.communities[community.perspective.uuid].channels
      ).length
    ).toBe(1);

    store.commit("addChannel", {
      communityId: community.perspective.uuid,
      channel,
    });

    expect(
      Object.values(
        store.state.communities[community.perspective.uuid].channels
      ).length
    ).toBe(2);
  });

  test("Check duplicate channel if one exists already", async () => {
    expect(Object.values(store.state.communities).length).toBe(0);

    store.commit("addCommunity", community);

    expect(Object.values(store.state.communities)[0].perspective.uuid).toBe(
      community.perspective.uuid
    );

    store.commit("addChannel", {
      communityId: community.perspective.uuid,
      channel,
    });

    expect(
      Object.keys(store.state.communities[community.perspective.uuid].channels)
    ).toStrictEqual([
      "30e4a29e-1373-4c8a-a5af-a2353c919e7a",
      channel.perspective.uuid,
    ]);

    store.commit("addChannel", {
      communityId: community.perspective.uuid,
      channel,
    });

    expect(
      Object.keys(store.state.communities[community.perspective.uuid].channels)
    ).toStrictEqual([
      "30e4a29e-1373-4c8a-a5af-a2353c919e7a",
      channel.perspective.uuid,
    ]);
  });

  test("Create Profile", async () => {
    const did = "did:key:zQ3shZj7gEX6tbrQGvMJeHsL2hWRcQPUmJHoTFZzEZdEsHBwa";
    expect(store.state.userDid).not.toBe(did);
    expect(store.state.userProfile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    await store.commit("createProfile", {
      profile,
      did,
    });

    expect(store.state.userDid).toBe(did);
    expect(store.state.userProfile).not.toBeNull();
    expect(store.state.userProfile).toStrictEqual(profile);
  });
});
