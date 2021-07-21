import "@testing-library/vue";
import { State } from "@/store";
import actions from "@/store/actions";
import getters from "@/store/getters";
import mutations from "@/store/mutations";
import { createStore, Store } from "vuex";
import community from "../../fixtures/community.json";
import * as getLinks from "../../../core/queries/getLinks";
import { Expression } from "@perspect3vism/ad4m-types";
import getCommunityMembersLinkFixture from "../../fixtures/getCommunityMembersLink.json";
import getProfileFixture from "../../fixtures/getProfile.json";
import * as getExpressionNoCache from "@/core/queries/getExpression";

describe("Get Community Members", () => {
  let store: Store<State>;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(getLinks, "getLinks")
      // @ts-ignore
      .mockResolvedValue(getCommunityMembersLinkFixture);

    // @ts-ignore
    jest
      .spyOn(getExpressionNoCache, "getExpressionNoCache")
      .mockImplementation(async (url) => {
        return getProfileFixture as unknown as Expression;
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
            fontSize: "md"
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
        // @ts-ignore
        communities: {
          [community.perspective.uuid]: community,
        },
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

  test("Check if the getCommunityMembers work", async () => {
    const communityId = community.perspective.uuid;
    expect(store.state.communities[communityId].members).toStrictEqual([]);

    await store.dispatch("getCommunityMembers", {
      communityId,
    });

    expect(store.state.communities[communityId].members.length).toBe(1);
  });

  test("Check if the getCommunityMembers with wrong community id or community that don't exists", async () => {
    const communityId = community.perspective.uuid;

    try {
      await store.dispatch("getCommunityMembers", {
        communityId: `${communityId}1`,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Expected to find profile expression language for this community"
      );
    }
  });
});
