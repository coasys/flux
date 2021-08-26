import { ExpressionGeneric } from "@perspect3vism/ad4m";
import type { AgentStatus } from "@perspect3vism/ad4m";

export class Profile {
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  profilePicture?: string;
  thumbnailPicture?: string;
}

export class ProfileExpression extends ExpressionGeneric(Profile) {}

export interface UserState {
  agent: AgentStatus;
  profile: Profile | null;
}
