import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { UserState } from "../types";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state(): UserState {
    return {
      profile: null,
      friends: [],
      agent: {
        isInitialized: false,
        isUnlocked: false,
        did: "",
        didDocument: "",
      },
    };
  },
  getters,
  actions: {
    ...mutations,
    ...actions,
  },
});
