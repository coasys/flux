import { createStore } from "vuex";
import VuexPersistence from "vuex-persist";
import type Expression from "@perspect3vism/ad4m/Expression";
import Address from "@perspect3vism/ad4m/Address";
import ExpressionRef, { parseExprURL } from "@perspect3vism/ad4m/ExpressionRef";

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
  currentExpressionLinks: ExpressionAndRef[];
  currentExpressionMessages: ExpressionAndRef[];
  typedExpressionLanguages: JuntoExpressionReference[];
  membraneType: MembraneType;
  groupExpressionRef: string;
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
  profilePicture: string;
  thumbnailPicture: string;
}

export interface State {
  currentTheme: string;
  currentCommunity: CommunityState | null;
  currentCommunityView: CommunityView | null;
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
  userProfile: Profile | null;
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
  community: string;
  channel: ChannelState;
}

const vuexLocal = new VuexPersistence<State>({
  storage: window.localStorage,
});

export default createStore({
  state: {
    currentTheme: "light",
    currentCommunity: null,
    currentCommunityView: null,
    communities: [],
    localLanguagesPath: "",
    databasePerspective: "",
    applicationStartTime: new Date(),
    expressionUI: [],
    agentUnlocked: false,
    userProfile: null,
  },
  plugins: [vuexLocal.plugin],
  mutations: {
    addCommunity(state: State, payload: CommunityState) {
      state.communities.push(payload);
    },

    setLanguagesPath(state: State, payload: string) {
      state.localLanguagesPath = payload;
    },

    // navigate to a new community
    changeCommunity(state: State, payload) {
      state.currentCommunity = payload.value;
    },

    // navigate to a different view within a community (i.e. feeds, channels, etc)
    changeCommunityView(state: State, payload) {
      console.log("Changing community view", payload);
      state.currentCommunityView = payload.value;
    },

    // Toggle theme
    toggleTheme(state: State, payload) {
      const root = document.documentElement;

      if (payload.value === "light") {
        state.currentTheme = "light";
        root.style.setProperty("--junto-primary-dark", "#000");
        root.style.setProperty("--junto-primary", "#333");
        root.style.setProperty("--junto-primary-medium", "#555");
        root.style.setProperty("--junto-primary-light", "#999");
        root.style.setProperty("--junto-border-color", "#eee");
        root.style.setProperty("--junto-accent-color", "#B3808F");
        root.style.setProperty("--junto-background-color", "#fff");
        root.style.setProperty("--junto-background-rgba", "255, 255, 255");
      } else if (payload.value === "dark") {
        state.currentTheme = "dark";
        root.style.setProperty("--junto-primary-dark", "#fff");
        root.style.setProperty("--junto-primary", "#f0f0f0");
        root.style.setProperty("--junto-primary-medium", "#f0f0f0");
        root.style.setProperty("--junto-primary-light", "#999999");
        root.style.setProperty("--junto-border-color", "#555");
        root.style.setProperty("--junto-accent-color", "#B3808F");
        root.style.setProperty("--junto-background-color", "#333");
        root.style.setProperty("--junto-background-rgba", "0, 0, 0");
      }
    },

    addDatabasePerspective(state: State, payload) {
      state.databasePerspective = payload;
    },

    addExpressionAndLinkFromLanguageAddress: (state: State, payload) => {
      state.communities.forEach((community) => {
        //@ts-ignore
        // if (community.value.linkLanguageAddress == payload.linkLanguage) {
        //   return;
        // }
        //@ts-ignore
        community.value.channels.forEach((channel) => {
          if (channel.linkLanguageAddress == payload.value.linkLanguage) {
            console.log(
              new Date().toISOString(),
              "Adding to link and exp to channel!"
            );
            channel.currentExpressionLinks.push({
              expression: payload.value.link,
              url: parseExprURL(payload.value.linkLanguage),
            } as ExpressionAndRef);
            channel.currentExpressionMessages.push({
              expression: payload.value.message,
              url: parseExprURL(payload.value.link.target),
            });
          }
        });
      });
    },

    updateAgentLockState(state: State, payload: boolean) {
      state.agentUnlocked = payload;
    },

    addExpressionUI(state: State, payload: ExpressionUIIcons) {
      state.expressionUI.push(payload);
    },

    updateApplicationStartTime(state: State, payload: Date) {
      state.applicationStartTime = payload;
    },

    addChannel(state: State, payload: AddChannel) {
      const community = state.communities.find(
        //@ts-ignore
        (community) => community.value.perspective === payload.value.community
      );
      if (community != undefined) {
        //@ts-ignore
        community.value.channels.push(payload.value.channel);
      }
    },

    createProfile(state: State, payload: Profile) {
      state.userProfile = payload;
    },

    updateCommunityMetadata(state: State, payload) {
      const community = state.communities.find(
        //@ts-ignore
        (community) => community.value.perspective === payload.value.community
      );
      if (community != undefined) {
        //@ts-ignore
        community.value.name = payload.value.name;
        //@ts-ignore
        community.value.description = payload.value.description;
        //@ts-ignore
        community.value.groupExpressionRef = payload.value.groupExpressionRef;
      }
    },
  },
  getters: {
    //Dump the whole state
    dumpState(state: State) {
      return state;
    },
    getProfile(state: State) {
      return state.userProfile;
    },
    // Get the list of communities a user is a part of
    getCommunities(state: State) {
      return state.communities;
    },
    // Get the current community the user is viewing
    getCurrentCommunity(state: State) {
      return state.currentCommunity;
    },

    // Get the view (i.e. feed,  channel) of the community a user is currently on
    getCurrentCommunityView(state: State) {
      return state.currentCommunityView;
    },
    // Get current theme
    getCurrentTheme(state: State) {
      return state.currentTheme;
    },

    getLanguagePath(state: State) {
      return state.localLanguagesPath;
    },

    getCommunityById: (state) => (id: string) => {
      return state.communities.find((todo) => todo.perspective === id);
    },

    getDatabasePerspective(state: State) {
      return state.databasePerspective;
    },

    getCurrentChannel(state) {
      //@ts-ignore
      const cha = state.currentCommunity.value.channels.find(
        (channel: ChannelState) => {
          //@ts-ignore
          return (
            channel.perspective === state.currentCommunityView!.perspective
          );
        }
      );
      return cha;
    },

    getPerspectiveFromLinkLanguage: (state) => (linkLanguage: string) => {
      let perspective;
      state.communities.forEach((community) => {
        //@ts-ignore
        if (community.value.linkLanguageAddress == linkLanguage) {
          return community;
        }
        //@ts-ignore
        community.value.channels.forEach((channel) => {
          if (channel.linkLanguageAddress == linkLanguage) {
            perspective = channel;
          }
        });
      });
      return perspective;
    },

    getAllExpressionLanguagesNotLoaded(state: State): Address[] {
      const expressionLangs: Address[] = [];
      state.communities.forEach((community) => {
        //@ts-ignore
        community.value.expressionLanguages.forEach((expLang) => {
          if (
            expressionLangs.indexOf(expLang) === -1 &&
            //@ts-ignore
            state.expressionUI.find(
              (val: ExpressionUIIcons) => val.languageAddress === expLang.value
            ) === undefined
          ) {
            expressionLangs.push(expLang);
          }
        });
      });
      return expressionLangs;
    },

    getAgentLockStatus(state: State): boolean {
      return state.agentUnlocked;
    },

    getApplicationStartTime(state: State): Date {
      return state.applicationStartTime;
    },
  },
});
