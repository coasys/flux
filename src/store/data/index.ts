import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { DataState } from "@/store/types";

export default {
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
};
