import { createStore, Store } from "vuex";
import VuexPersistence from "vuex-persist";
import type Expression from "@perspect3vism/ad4m/Expression";
import Address from "@perspect3vism/ad4m/Address";
import ExpressionRef, { parseExprURL } from "@perspect3vism/ad4m/ExpressionRef";

import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createChannel } from "@/core/methods/createChannel";
import { createProfile } from "@/core/methods/createProfile";
import { createExpression } from "@/core/mutations/createExpression";
import { createUniqueExpressionLanguage } from "@/core/mutations/createUniqueExpressionLanguage";
import { publishSharedPerspective } from "@/core/mutations/publishSharedPerspective";
import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { getLanguage } from "@/core/queries/getLanguage";
import { getPerspective } from "@/core/queries/getPerspective";
import { installSharedPerspective } from "@/core/mutations/installSharedPerspective";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";

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
  actions: {
    async createCommunity(
      { commit, getters },
      { perspectiveName, description }
    ) {
      //TODO: @eric: show loading animation here
      const createSourcePerspective = await addPerspective(perspectiveName);
      console.log("Created perspective", createSourcePerspective);
      const uid = uuidv4().toString();

      const builtInLangPath = getters.getLanguagePath;

      //Create shortform expression language
      const shortFormExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath.value, "shortform/build"),
        "shortform",
        uid
      );
      console.log("Response from create exp lang", shortFormExpressionLang);
      //Create group expression language
      const groupExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath.value, "group-expression/build"),
        "group-expression",
        uid
      );
      const profileExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath.value, "profiles/build"),
        "agent-profiles",
        uid
      );
      console.log("Response from create exp lang", groupExpressionLang);
      const expressionLangs = [
        shortFormExpressionLang.address!,
        groupExpressionLang.address!,
        profileExpressionLang.address!,
      ];
      const typedExpLangs = [
        {
          languageAddress: shortFormExpressionLang.address!,
          expressionType: ExpressionTypes.ShortForm,
        } as JuntoExpressionReference,
        {
          languageAddress: groupExpressionLang.address!,
          expressionType: ExpressionTypes.GroupExpression,
        } as JuntoExpressionReference,
        {
          languageAddress: profileExpressionLang.address!,
          expressionType: ExpressionTypes.ProfileExpression,
        } as JuntoExpressionReference,
      ];

      //Publish perspective
      const publish = await publishSharedPerspective({
        uuid: createSourcePerspective.uuid!,
        name: perspectiveName,
        description: description,
        type: "holochain",
        uid: uid,
        requiredExpressionLanguages: expressionLangs,
        allowedExpressionLanguages: expressionLangs,
      });
      console.log("Published perspective with response", publish);

      //Create link denoting type of community
      const addLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: "sioc://community",
        predicate: "rdf://type",
      });
      console.log("Added typelink with response", addLink);
      //TODO: we are sleeping here to ensure that all DNA's are installed before trying to do stuff
      //ideally installing DNA's in holochain would be a sync operation to avoid this
      //await this.sleep(5000);

      //Create the group expression
      const createExp = await createExpression(
        groupExpressionLang.address!,
        JSON.stringify({
          name: perspectiveName,
          description: description,
        })
      );
      console.log("Created group expression with response", createExp);

      //Create link between perspective and group expression
      const addGroupExpLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: createExp,
        predicate: "rdf://class",
      });
      console.log("Created group expression link", addGroupExpLink);

      const profile: Profile = getters.getProfile;

      const createProfileExpression = await createProfile(
        profileExpressionLang.address!,
        profile.username,
        profile.email,
        profile.givenName,
        profile.familyName
      );

      //Create link between perspective and group expression
      const addProfileLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: createProfileExpression,
        predicate: "sioc://has_member",
      });
      console.log("Created group expression link", addProfileLink);

      //Next steps: create another perspective + share with social-context-channel link language and add above expression DNA's onto it
      //Then create link from source social context pointing to newly created SharedPerspective w/appropriate predicate to denote its a dm channel
      const channel = await createChannel(
        "Default Message Channel",
        description,
        uid,
        createSourcePerspective.uuid!,
        publish.linkLanguages![0]!.address!,
        expressionLangs,
        MembraneType.Inherited,
        typedExpLangs
      );

      //Get the created community perspective so we can get the SharedPerspectiveURL
      const communityPerspective = await getPerspective(
        createSourcePerspective.uuid!
      );

      //Add the perspective to community store
      commit({
        type: "addCommunity",
        value: {
          name: perspectiveName,
          description: description,
          linkLanguageAddress: publish.linkLanguages![0]!.address!,
          channels: [channel],
          perspective: createSourcePerspective.uuid!,
          expressionLanguages: expressionLangs,
          typedExpressionLanguages: typedExpLangs,
          groupExpressionRef: createExp,
          sharedPerspectiveUrl: communityPerspective.sharedURL!,
        },
      });

      //Get and cache the expression UI for each expression language
      for (const [, lang] of expressionLangs.entries()) {
        console.log("CreateCommunity.vue: Fetching UI lang:", lang);
        const languageRes = await getLanguage(lang);
        const uiData: ExpressionUIIcons = {
          languageAddress: lang,
          createIcon: languageRes.constructorIcon!.code!,
          viewIcon: languageRes.iconFor!.code!,
        };
        commit({
          type: "addExpressionUI",
          value: uiData,
        });
        // await this.sleep(40);
      }
    },
    // TODO: Use something else than any
    async joinCommunity(store: any, { joiningLink }) {
      const installedPerspective = await installSharedPerspective(joiningLink);
      console.log(
        new Date(),
        "Installed perspective raw data",
        installedPerspective
      );

      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      const typedExpressionLanguages = await getTypedExpressionLanguages(
        installedPerspective.sharedPerspective!,
        true,
        store
      );

      const profileExpLang = typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.ProfileExpression
      );
      if (profileExpLang != undefined) {
        const profile: Profile = store.getters.getProfile;

        const createProfileExpression = await createProfile(
          profileExpLang.languageAddress!,
          profile.username,
          profile.email,
          profile.givenName,
          profile.familyName
        );

        //Create link between perspective and group expression
        const addProfileLink = await createLink(installedPerspective.uuid!, {
          source: `${installedPerspective.sharedPerspective!.linkLanguages![0]!
            .address!}://self`,
          target: createProfileExpression,
          predicate: "sioc://has_member",
        });
        console.log("Created group expression link", addProfileLink);
      }

      store.commit({
        type: "addCommunity",
        value: {
          name: installedPerspective.name,
          linkLanguageAddress:
            installedPerspective.sharedPerspective!.linkLanguages![0]!.address!,
          channels: [],
          perspective: installedPerspective.uuid!,
          expressionLanguages:
            installedPerspective.sharedPerspective!.requiredExpressionLanguages,
          typedExpressionLanguages: typedExpressionLanguages,
          sharedPerspectiveUrl: joiningLink, //TODO: this will have to be string split once we add proof onto the URL
        },
      });
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
