import LanguageRef from "ad4m/LanguageRef";
import { createStore } from "vuex";

export interface CommunityState {
  name: string;
  channels: string[];
  perspective: string;
  expressionLanguages: ExpressionReference[];
}

export interface CommunityView {
  name: string;
  type: FeedType;
}

export enum FeedType {
  Feed,
  Dm,
}

export interface State {
  currentTheme: string;
  currentCommunity: CommunityState;
  currentCommunityView: CommunityView;
  communities: CommunityState[];
}

export enum ExpressionTypes {
  ShortForm,
}

export interface ExpressionReference {
  languageAddress: LanguageRef;
  expressionType: ExpressionTypes;
}

export default createStore({
  state() {
    const state: State = {
      currentTheme: "light",
      currentCommunity: {
        name: "JUNTO",
        channels: ["home", "inspiration", "events"],
        perspective: "",
        expressionLanguages: [],
      },
      currentCommunityView: { name: "main", type: FeedType.Feed },
      communities: [
        {
          name: "JUNTO",
          channels: ["home", "inspiration", "events"],
          perspective: "",
          expressionLanguages: [],
        },
        {
          name: "Holochain",
          channels: ["home", "holo-fuel", "meetups", "when-moon"],
          perspective: "",
          expressionLanguages: [],
        },
        {
          name: "Naruto",
          channels: ["home", "anbu"],
          perspective: "",
          expressionLanguages: [],
        },
        {
          name: "Hoops",
          channels: ["home", "hoopiddydoops"],
          perspective: "",
          expressionLanguages: [],
        },
      ],
    };
    return state;
  },
  mutations: {
    // navigate to a new community
    changeCommunity(state: State, payload) {
      console.log("changing community");
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
  },
  getters: {
    // Get the list of communities a user is a part of
    getCommunities(state: State) {
      console.log(state.communities);
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
  },
});
