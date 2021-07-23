import { UserState, Profile } from "@/store/types";
import { AgentStatus } from "@perspect3vism/ad4m-types";

export default {
  updateAgentStatus(state: UserState, payload: AgentStatus): void {
    state.agent = payload;
  },

  setUserProfile(state: UserState, payload: Profile): void {
    state.profile = payload;
  },
};
