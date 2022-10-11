import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { DataState } from "@/store/types";
import { defineStore } from "pinia";

export const useDataStore = defineStore("data", {
  state(): DataState {
    return {
      communities: {},
      neighbourhoods: {},
      channels: {},
    };
  },
  getters,
  actions: {
    ...mutations,
    ...actions,
  },
});
