import { createStore } from "vuex";
import VuexPersistence from "vuex-persist";
import type Expression from "@perspect3vism/ad4m/Expression";
import ExpressionRef from "@perspect3vism/ad4m/ExpressionRef";

import actions from "./actions";
import mutations from "./mutations";
import getters from "./getters";
export interface CommunityState {
  //NOTE: here by having a static name + description we are assuming that these are top level metadata items that each group will have
  name: string;
  description: string;
  channels: ChannelState[];
  perspective: string; //NOTE: this is essentially the UUID for the community
  linkLanguageAddress: string;
  expressionLanguages: string[];
  typedExpressionLanguages: JuntoExpressionReference[];
  groupExpressionRef: string;
  sharedPerspectiveUrl: string;
}

// Vuex state of a given channel
export interface ChannelState {
  name: string;
  perspective: string; //NOTE: this is essentially the UUID for the community
  linkLanguageAddress: string;
  sharedPerspectiveUrl: string;
  type: FeedType;
  createdAt: Date;
  currentExpressionLinks: ExpressionAndLang[];
  currentExpressionMessages: ExpressionAndRef[];
  typedExpressionLanguages: JuntoExpressionReference[];
  membraneType: MembraneType;
  groupExpressionRef: string;
}

export interface ExpressionAndLang {
  expression: Expression;
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
  address: string;
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
  name: "light" | "dark";
  hue: number;
}

export interface UIState {
  toast: ToastState;
  theme: ThemeState;
}

export interface State {
  ui: UIState;
  communities: CommunityState[];
  localLanguagesPath: string;
  databasePerspective: string;
  //This tells us when the application was started; this tells us that between startTime -> now all messages should have been received
  //via signals and thus we do not need to query for this time period
  applicationStartTime: Date;
  //TODO: this is a horrible type for this use; would be better to have a real map with values pointing to same strings where appropriate
  //fow now this is fine
  expressionUI: ExpressionUIIcons[];
  agentUnlocked: boolean;
  agentInit: boolean;
  userProfile: Profile | null;
  activeCommunityMembers: Profile[]
}

export interface ExpressionUIIcons {
  languageAddress: string;
  createIcon: string;
  viewIcon: string;
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
});

export default createStore({
  state: {
    ui: {
      theme: {
        name: "light",
        hue: 0,
      },
      toast: {
        variant: "",
        message: "",
        open: false,
      },
    },
    communities: [],
    localLanguagesPath: "",
    databasePerspective: "",
    applicationStartTime: new Date(),
    expressionUI: [],
    agentUnlocked: false,
    agentInit: false,
    userProfile: null,
    activeCommunityMembers: []
  },
  plugins: [vuexLocal.plugin],
  mutations: mutations,
  actions: actions,
  getters: getters,
});
