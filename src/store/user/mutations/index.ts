import { State, Profile } from "@/store/types";
import { AgentStatus } from "@perspect3vism/ad4m-types";

export default {
  updateAgentStatus(state: State, payload: AgentStatus): void {
    state.user.agent = payload;
  },

  setUserProfile(state: State, payload: Profile): void {
    state.user.profile = payload;
  },
};
