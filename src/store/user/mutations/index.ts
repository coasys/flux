import { Profile } from "@/store/types";
import { AgentStatus } from "@perspect3vism/ad4m";
import { useUserStore } from "..";

export default {
  updateAgentStatus(payload: AgentStatus): void {
    const store = useUserStore();
    store.agent = payload;
  },

  updateAgentLockState(payload: boolean): void {
    const store = useUserStore();
    store.agent.isUnlocked = payload;
  },

  setUserProfile(payload: Profile): void {
    const store = useUserStore();
    store.profile = payload;
  },
};
