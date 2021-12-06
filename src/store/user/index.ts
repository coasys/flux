import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { UserState } from "../types";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state(): UserState {
    return {
      profile: null,
      agent: {
        isInitialized: false,
        isUnlocked: false,
        did: "",
        didDocument: "",
      },
      fluxPerspectiveId: undefined,
    };
  },
  getters,
  actions: {
    ...mutations,
    ...actions,
  },
});
