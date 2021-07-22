import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { UserState } from "../types";

export default {
  state: (): UserState => ({
    profile: null,
    agent: {
      isInitialized: false,
      isUnlocked: false,
      did: "",
      didDocument: "",
    },
  }),
  mutations,
  actions,
  getters,
};
