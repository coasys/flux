import VuexPersistence from "vuex-persist";
import { createDirectStore } from "direct-vuex";
import user from "./user";
import data from "./data";
import application from "./application";

import actions from "./actions";
import mutations from "./mutations";
import { State } from "./types";

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
});

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
