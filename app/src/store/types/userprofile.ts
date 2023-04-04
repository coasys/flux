import { ExpressionGeneric } from "@perspect3vism/ad4m";
import type { AgentStatus } from "@perspect3vism/ad4m";
import { Profile } from "utils/types";

export interface UserState {
  friends: string[];
  agent: AgentStatus;
  profile: Profile | null;
  agentProfileProxyPerspectiveId?: string;
}
