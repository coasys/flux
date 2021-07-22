import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { LocalCommunityState, NeighbourhoodState } from "@/store/types";

export interface DataState {
  communities: { [perspectiveUuid: string]: LocalCommunityState };
  neighbourhoods: { [perspectiveUuid: string]: NeighbourhoodState };
}

export default {
  state: (): DataState => ({
    communities: {},
    neighbourhoods: {},
  }),
  mutations: {},
  actions: {},
  getters: {},
};
