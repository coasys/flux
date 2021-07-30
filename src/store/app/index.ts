import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { ApplicationState } from "../types";

export default {
  state: (): ApplicationState => ({
    updateState: "not-available",
    windowState: "visible",
    applicationStartTime: new Date(),
    localLanguagesPath: "",
    databasePerspective: "",
    expressionUI: {},
    modals: {
      showCreateCommunity: false,
      showEditCommunity: false,
      showCommunityMembers: false,
      showCreateChannel: false,
      showEditProfile: false,
      showSettings: false,
      showCommunitySettings: false,
      showInviteCode: false,
      showDisclaimer: true,
    },
    showSidebar: true,
    showGlobalLoading: false,
    globalTheme: {
      fontSize: "md",
      fontFamily: "default",
      name: "light",
      hue: 270,
      saturation: 60,
    },
    currentTheme: "global",
    toast: {
      variant: "",
      message: "",
      open: false,
    },
    globalError: {
      show: false,
      message: "",
    },
  }),
  mutations,
  actions,
  getters,
};
