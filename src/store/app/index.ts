import { defineModule, localActionContext, localGetterContext } from "direct-vuex"
import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { ApplicationState } from "../types";

const appModule = defineModule({
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
})

export default appModule;

export const appGetterContext = (args: [any, any, any, any]) => localGetterContext(args, appModule);
export const appActionContext = (context: any) => localActionContext(context, appModule);
