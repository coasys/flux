import { ExpressionGeneric } from "@perspect3vism/ad4m";
import type { AgentStatus } from "@perspect3vism/ad4m";
import { Profile } from "@fluxapp/types";

export interface UserState {
  agent: AgentStatus;
  profile: Profile | null;
  agentProfileProxyPerspectiveId?: string;
}
