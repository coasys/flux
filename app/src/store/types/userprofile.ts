import { ExpressionGeneric } from "@coasys/ad4m";
import type { AgentStatus } from "@coasys/ad4m";
import { Profile } from "@coasys/flux-types";

export interface UserState {
  agent: AgentStatus;
  profile: Profile | null;
  agentProfileProxyPerspectiveId?: string;
}
