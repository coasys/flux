import { defineModule, localActionContext, localGetterContext } from "direct-vuex"
import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { UserState } from "../types";

const userModule = defineModule({
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
});

export default userModule;

export const userGetterContext = (args: [any, any, any, any]) => localGetterContext(args, userModule);
export const userActionContext = (context: any) => localActionContext(context, userModule);
