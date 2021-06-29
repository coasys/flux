import { createStore } from "vuex";
import VuexPersistence from "vuex-persist";
import type Expression from "@perspect3vism/ad4m/Expression";
import ExpressionRef from "@perspect3vism/ad4m/ExpressionRef";
import { LinkExpression } from "@perspect3vism/ad4m-executor";

import actions from "./actions";
import mutations from "./mutations";
import getters from "./getters";

export interface CommunityState {
  //NOTE: here by having a static name + description we are assuming that these are top level metadata items that each group will have
  name: string;
  description: string;
  channels: { [x: string]: ChannelState };
  perspective: string; //NOTE: this is essentially the UUID for the community
  linkLanguageAddress: string;
  expressionLanguages: string[];
  typedExpressionLanguages: JuntoExpressionReference[];
  groupExpressionRef: string;
  sharedPerspectiveUrl: string;
  members: Expression[];
}

// Vuex state of a given channel
export interface ChannelState {
  name: string;
  hasNewMessages: boolean;
  scrollTop?: number;
  perspective: string; //NOTE: this is essentially the UUID for the community
  linkLanguageAddress: string;
  sharedPerspectiveUrl: string;
  type: FeedType;
  createdAt: Date;
  currentExpressionLinks: { [x: string]: LinkExpressionAndLang };
  currentExpressionMessages: { [x: string]: ExpressionAndRef };
  typedExpressionLanguages: JuntoExpressionReference[];
  membraneType: MembraneType;
  groupExpressionRef: string;
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

export interface ThemeState {
  name: string;
  fontFamily: string;
  hue: number;
  saturation: number;
}

export interface ModalsState {
  showCreateCommunity: boolean;
  showEditCommunity: boolean;
  showCommunityMembers: boolean;
  showCreateChannel: boolean;
  showEditProfile: boolean;
  showSettings: boolean;
}

export interface UIState {
  toast: ToastState;
  theme: ThemeState;
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

export interface State {
  ui: UIState;
  communities: { [x: string]: CommunityState };
  localLanguagesPath: string;
  databasePerspective: string;
  //This tells us when the application was started; this tells us that between startTime -> now all messages should have been received
  //via signals and thus we do not need to query for this time period
  applicationStartTime: Date;
  //TODO: this is a horrible type for this use; would be better to have a real map with values pointing to same strings where appropriate
  //fow now this is fine
  expressionUI: { [x: string]: ExpressionUIIcons };
  agentUnlocked: boolean;
  agentInit: boolean;
  userProfile: Profile | null;
  updateState: UpdateState;
  userDid: string;
  windowState: "minimize" | "visible" | "foreground";
}

export interface ExpressionUIIcons {
  languageAddress: string;
  createIcon?: string | undefined;
  viewIcon?: string | undefined;
  name: string;
}

export enum ExpressionTypes {
  ShortForm,
  GroupExpression,
  ProfileExpression,
  YouTube,
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
      },
      showSidebar: true,
      showGlobalLoading: false,
      theme: {
        fontFamily: "default",
        name: "",
        hue: 270,
        saturation: 50,
      },
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
    communities: {},
    localLanguagesPath: "",
    databasePerspective: "",
    applicationStartTime: new Date(),
    expressionUI: {},
    agentUnlocked: false,
    agentInit: false,
    userProfile: null,
    updateState: "not-available",
    userDid: "",
    windowState: "visible",
  },
  plugins: [vuexLocal.plugin],
  mutations: mutations,
  actions: actions,
  getters: getters,
});
