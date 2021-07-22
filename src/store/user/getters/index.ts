import { Profile, State } from "@/store/types";

export default {
  getProfile(state: State): Profile | null {
    return state.user.profile;
  },
};
