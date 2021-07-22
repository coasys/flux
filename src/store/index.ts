import VuexPersistence from "vuex-persist";
import { createDirectStore } from "direct-vuex";
import user from "./user";
import data from "./data";
import application from "./application";

import actions from "./actions";
import mutations from "./mutations";
import { State } from "./types";

const persistApplication = new VuexPersistence<State>({
  storage: window.localStorage,
  modules: ["application"],
  reducer: (state) => ({
    communities: state.communities,
    localLanguagesPath: state.localLanguagesPath,
    databasePerspective: state.databasePerspective,
    expressionUI: state.expressionUI,
    userProfile: state.userProfile,
    agentStatus: state.agentStatus,
    ui: {
      showSidebar: state.ui.showSidebar,
      globalTheme: state.ui.globalTheme,
      currentTheme: state.ui.currentTheme,
      modals: { showDisclaimer: state.ui.modals.showDisclaimer },
    },
  }),
});

const persistUser = 

const persistData = 


const {
  store,
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
} = createDirectStore({
  modules: {
    user,
    data,
    application,
  },
  plugins: [vuexLocal.plugin],
  mutations: mutations,
  actions: actions,
  getters: {
    getLanguagePath(state: State): string {
      return state.localLanguagesPath;
    },

    getDatabasePerspective(state: State): string {
      return state.databasePerspective;
    },

    getApplicationStartTime(state: State): Date {
      return state.applicationStartTime;
    },

    getLanguageUI: (state: State) => (language: string) => {
      return state.expressionUI[language];
    },
  },
});

export default store;

export {
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
};

// The following lines enable types in the injected store '$store'.
export type AppStore = typeof store;
declare module "vuex" {
  interface Store<S> {
    direct: AppStore;
  }
}
