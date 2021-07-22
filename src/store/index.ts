import { createStore } from "vuex";
import VuexPersistence from "vuex-persist";
import type {
  AgentStatus,
  Expression,
  LinkExpression,
} from "@perspect3vism/ad4m-types";
import { ExpressionRef, PerspectiveHandle } from "@perspect3vism/ad4m-types";

import actions from "./actions";
import mutations from "./mutations";
import getters from "./getters";

export interface State {
  ui: UIState;
  neighbourhoods: { [perspectiveUuid: string]: NeighbourhoodState };
  communities: { [perspectiveUuid: string]: LocalCommunityState };
  localLanguagesPath: string;
  databasePerspective: string;
  applicationStartTime: Date;
  expressionUI: { [x: string]: ExpressionUIIcons };
  userProfile: Profile | null;
  updateState: UpdateState;
  agentStatus: AgentStatus;
  windowState: "minimize" | "visible" | "foreground";
}

export interface NeighbourhoodState {
  name: string;
  description: string;
  perspective: PerspectiveHandle;
  typedExpressionLanguages: JuntoExpressionReference[];
  groupExpressionRef: string;
  neighbourhoodUrl: string;
  membraneType: MembraneType;
  membraneRoot?: string;
  linkedNeighbourhoods: string[];
  members: Expression[];
  currentExpressionLinks: { [x: string]: LinkExpression };
  currentExpressionMessages: { [x: string]: ExpressionAndRef };
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
  theme?: ThemeState;
  channels: { [persectiveUuid: string]: LocalChannelState };
  currentChannelId: string | undefined | null;
}

export interface LocalChannelState {
  perspectiveUuid: string;
  hasNewMessages: boolean;
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

export interface Profile {
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  profilePicture?: string;
  thumbnailPicture?: string;
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

export interface UIState {
  toast: ToastState;
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

const vuexLocal = new VuexPersistence<State>({
  storage: window.localStorage,
  reducer: (state) => ({
    communities: state.communities,
    localLanguagesPath: state.localLanguagesPath,
    databasePerspective: state.databasePerspective,
    expressionUI: state.expressionUI,
    userProfile: state.userProfile,
    agentStatus: state.agentStatus,
    ui: {
      showSidebar: state.ui.showSidebar,
      globalTheme: state.ui.globalTheme,
      currentTheme: state.ui.currentTheme,
      modals: { showDisclaimer: state.ui.modals.showDisclaimer },
    },
  }),
});

export default createStore({
  state: {
    ui: {
      modals: {
        showCreateCommunity: false,
        showEditCommunity: false,
        showCommunityMembers: false,
        showCreateChannel: false,
        showEditProfile: false,
        showSettings: false,
        showCommunitySettings: false,
        showInviteCode: false,
        showDisclaimer: true,
      },
      showSidebar: true,
      showGlobalLoading: false,
      globalTheme: {
        fontSize: "md",
        fontFamily: "default",
        name: "light",
        hue: 270,
        saturation: 60,
      },
      currentTheme: "global",
      toast: {
        variant: "",
        message: "",
        open: false,
      },
      globalError: {
        show: false,
        message: "",
      },
    },
    neighbourhoods: {},
    communities: {},
    localLanguagesPath: "",
    databasePerspective: "",
    applicationStartTime: new Date(),
    expressionUI: {},
    agentStatus: {
      isInitialized: false,
      isUnlocked: false,
      did: "",
      didDocument: "",
    },
    userProfile: null,
    updateState: "not-available",
    windowState: "visible",
  },
  plugins: [vuexLocal.plugin],
  mutations: mutations,
  actions: actions,
  getters: getters,
});
