import type {
  AgentStatus,
  Expression,
  LinkExpression,
} from "@perspect3vism/ad4m";
import { ExpressionGeneric } from "@perspect3vism/ad4m";
import { ExpressionRef, PerspectiveHandle } from "@perspect3vism/ad4m";

export interface State {
  app: ApplicationState;
  data: DataState;
  user: UserState;
}

export interface DataState {
  communities: { [perspectiveUuid: string]: LocalCommunityState };
  channels: { [perspectiveUuid: string]: LocalChannelState };
  neighbourhoods: { [perspectiveUuid: string]: NeighbourhoodState };
}

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

export type WindowState = "minimize" | "visible" | "foreground";

export interface ApplicationState {
  expressionUI: { [x: string]: ExpressionUIIcons };
  localLanguagesPath: string;
  databasePerspective?: string;
  windowState: WindowState;
  toast: ToastState;
  applicationStartTime: Date;
  updateState: UpdateState;
  globalTheme: ThemeState;
  currentTheme: CurrentThemeState;
  modals: ModalsState;
  showSidebar: boolean;
  showGlobalLoading: boolean;
  globalError: {
    show: boolean;
    message: string;
  };
}

export interface NeighbourhoodState {
  name: string;
  description: string;
  image?: string;
  thumbnail?: string;
  perspective: PerspectiveHandle;
  typedExpressionLanguages: JuntoExpressionReference[];
  groupExpressionRef?: string;
  neighbourhoodUrl: string;
  membraneType: MembraneType;
  membraneRoot?: string;
  linkedPerspectives: string[];
  linkedNeighbourhoods: string[];
  members: ProfileExpression[];
  currentExpressionLinks: { [x: string]: LinkExpression };
  currentExpressionMessages: { [x: string]: ExpressionAndRef };
  createdAt?: Date;
}

export interface CommunityState {
  neighbourhood: NeighbourhoodState;
  state: LocalCommunityState;
}

export interface ChannelState {
  neighbourhood: NeighbourhoodState;
  state: LocalChannelState;
}

export interface LocalCommunityState {
  perspectiveUuid: string;
  theme: ThemeState;
  useLocalTheme: boolean;
  currentChannelId: string | undefined | null;
}

export interface LocalChannelState {
  perspectiveUuid: string;
  hasNewMessages: boolean;
  initialWorkerStarted: boolean;
  messageLoading: boolean;
  scrollTop?: number;
  feedType: FeedType;
  notifications: {
    mute: boolean;
  };
}

export interface LinkExpressionAndLang {
  expression: LinkExpression;
  language: string;
}

export interface ExpressionAndRef {
  expression: Expression;
  url: ExpressionRef;
}

export enum MembraneType {
  Inherited,
  Unique,
}

export interface CommunityView {
  name: string;
  type: FeedType;
  perspective: string;
}

export enum FeedType {
  Signaled,
  Static,
}

export interface ToastState {
  variant: "success" | "" | "danger" | "error";
  message: string;
  open: boolean;
}

export type CurrentThemeState = "global" | string;

export interface ThemeState {
  name: string;
  fontFamily: string;
  hue: number;
  saturation: number;
  fontSize: "sm" | "md" | "lg";
}

export interface ModalsState {
  showCreateCommunity: boolean;
  showEditCommunity: boolean;
  showCommunityMembers: boolean;
  showCreateChannel: boolean;
  showEditProfile: boolean;
  showSettings: boolean;
  showCommunitySettings: boolean;
  showInviteCode: boolean;
  showDisclaimer: boolean;
}

export type UpdateState =
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "checking";

export interface ExpressionUIIcons {
  languageAddress: string;
  createIcon: string;
  viewIcon: string;
  name: string;
}

export enum ExpressionTypes {
  ShortForm,
  GroupExpression,
  ProfileExpression,
  Other,
}

export interface JuntoExpressionReference {
  languageAddress: string;
  expressionType: ExpressionTypes;
}

export interface AddChannel {
  communityId: string;
  channel: ChannelState;
}
