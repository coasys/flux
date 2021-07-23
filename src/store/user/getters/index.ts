import { Profile, UserState } from "@/store/types";

export default {
  getProfile(state: UserState): Profile | null {
    return state.profile;
  },
  getUser(state: UserState): UserState | null {
    return state;
  },
};
