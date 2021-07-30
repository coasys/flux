import { UserState, Profile } from "@/store/types";
import { AgentStatus } from "@perspect3vism/ad4m";

export default {
  updateAgentStatus(state: UserState, payload: AgentStatus): void {
    state.agent = payload;
  },

  updateAgentLockState(state: UserState, payload: boolean): void {
    state.agent.isUnlocked = payload;
  },

  setUserProfile(state: UserState, payload: Profile): void {
    state.profile = payload;
  },
};
