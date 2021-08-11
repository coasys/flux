import {
  defineModule,
  localActionContext,
  localGetterContext,
} from "direct-vuex";
import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { DataState } from "@/store/types";

const dataModule = defineModule({
  state: (): DataState => {
    return {
      communities: {},
      neighbourhoods: {},
      channels: {},
    };
  },
  mutations,
  actions,
  getters,
});

export default dataModule;

export const dataGetterContext = (args: [any, any, any, any]) =>
  localGetterContext(args, dataModule);
export const dataActionContext = (context: any) =>
  localActionContext(context, dataModule);
