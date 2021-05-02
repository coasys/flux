import LanguageRef from "@perspect3vism/ad4m/LanguageRef";
import { createStore } from "vuex";
import VuexPersistence from "vuex-persist";
import type Expression from "@perspect3vism/ad4m/Expression";

export interface CommunityState {
  name: string;
  //TODO: this should not be here
  channels: [ChannelState];
  perspective: string;
  linkLanguageAddress: string;
  expressionLanguages: ExpressionReference[];
}

// Vuex state of a given channel; note that links or expression data is not cached here since that will occur on the perspectives local data
export interface ChannelState {
  name: string;
  perspective: string;
  linkLanguageAddress: string;
  type: FeedType;
  //This tells us how much time passed since last query at this channel
  lastSeenMessageTimestamp: Date | undefined;
  firstSeenMessageTimestamp: Date | undefined;
  createdAt: Date;
  syncLevel: SyncLevel;
  maxSyncSize: number;
  //Note: this is temporary measure until we can use a perspective to cache links and perspective syncing is implemented
  currentExpressionLinks: [Expression];
  currentExpressionMessages: [Expression];
}

export enum SyncLevel {
  Full,
  Rolling,
}

export interface CommunityView {
  name: string;
  type: FeedType;
  perspective: string;
  // currentExpressionLinks: [Expression];
  // currentExpressionMessages: [Expression];
}

export enum FeedType {
  Feed,
  Dm,
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
}

export enum ExpressionTypes {
  ShortForm,
}

export interface ExpressionReference {
  languageAddress: LanguageRef;
  expressionType: ExpressionTypes;
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
      } else if (payload.value === "dark") {
        state.currentTheme = "dark";
        root.style.setProperty("--junto-primary-dark", "#fff");
        root.style.setProperty("--junto-primary", "#f0f0f0");
        root.style.setProperty("--junto-primary-medium", "#f0f0f0");
        root.style.setProperty("--junto-primary-light", "#999999");
        root.style.setProperty("--junto-border-color", "#555");
        root.style.setProperty("--junto-accent-color", "#B3808F");
        root.style.setProperty("--junto-background-color", "#333");
      }
    },

    pushLinkExpression(state: State, payload: [string, Expression]) {
      state.communities.forEach((community) => {
        community.channels.forEach((channel) => {
          if (channel.linkLanguageAddress == payload[0]) {
            console.log("Pushing link to channel!");
            channel.currentExpressionLinks.push(payload[1]);
          }
        });
      });
    },

    addDatabasePerspective(state: State, payload) {
      state.databasePerspective = payload;
    },
  },
  getters: {
    //Dump the whole state
    dumpState(state: State) {
      return state;
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
      console.log(state.currentCommunityView);
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

    getCurrentChannelsLinks(state) {
      //@ts-ignore
      const foundChannel = state.currentCommunity.value.channels.find(
        (channel: ChannelState) => {
          //@ts-ignore
          return (
            channel.perspective === state.currentCommunityView!.perspective
          );
        }
      );
      if (foundChannel != undefined) {
        return foundChannel.currentExpressionLinks;
      } else {
        console.error(
          "did not find given channel when expected to, returning empty array"
        );
        return [];
      }
    },

    getPerspectiveFromLinkLanguage: (state) => (linkLanguage: string) => {
      state.communities.forEach((community) => {
        //@ts-ignore
        console.log("Searching community", community.value);
        //@ts-ignore
        if (community.value.linkLanguageAddress == linkLanguage) {
          return community;
        }
        //@ts-ignore
        community.value.channels.forEach((channel) => {
          if (channel.linkLanguageAddress == linkLanguage) {
            return channel;
          }
        });
      });
    },
  },
});
