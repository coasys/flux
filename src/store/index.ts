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
import sleep from "@/utils/sleep";

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
  profilePicture: string;
  thumbnailPicture: string;
}

export interface State {
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
      console.log("adding Community", payload);
      state.communities.push(payload);
    },

    setLanguagesPath(state: State, payload: string) {
      state.localLanguagesPath = payload;
    },

    addDatabasePerspective(state: State, payload) {
      state.databasePerspective = payload;
    },

    addExpressionAndLinkFromLanguageAddress: (state: State, payload) => {
      state.communities.forEach((community) => {
        community.channels.forEach((channel) => {
          if (channel.linkLanguageAddress == payload.linkLanguage) {
            console.log(
              new Date().toISOString(),
              "Adding to link and exp to channel!",
              payload
            );
            channel.currentExpressionLinks.push({
              expression: payload.link,
              language: payload.linkLanguage,
            } as ExpressionAndLang);
            channel.currentExpressionMessages.push({
              expression: payload.message,
              url: parseExprURL(payload.link.data.target),
            } as ExpressionAndRef);
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
      console.log(payload);
      const community = state.communities.find(
        //@ts-ignore
        (community) => community.perspective === payload.communityId
      );
      if (community !== undefined) {
        //@ts-ignore
        community.channels.push(payload.channel);
      }
    },

    createProfile(state: State, payload: Profile) {
      state.userProfile = payload;
    },

    updateCommunityMetadata(state: State, payload) {
      const community = state.communities.find(
        //@ts-ignore
        (community) => community.perspective === payload.community
      );
      if (community != undefined) {
        //@ts-ignore
        community.name = payload.name;
        //@ts-ignore
        community.description = payload.description;
        //@ts-ignore
        community.groupExpressionRef = payload.groupExpressionRef;
      }
    },
  },
  actions: {
    async createChannel({ commit, getters }, { communityId, name }) {
      const community = getters.getCommunity(communityId);
      const uid = uuidv4().toString();
      const channel = await createChannel(
        name,
        "",
        uid,
        community.perspective,
        community.linkLanguageAddress,
        community.expressionLanguages,
        MembraneType.Inherited,
        community.typedExpressionLanguages
      );

      commit("addChannel", {
        communityId: community.perspective,
        channel,
      });
    },
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
        path.join(builtInLangPath, "shortform/build"),
        "shortform",
        uid
      );
      console.log("Response from create exp lang", shortFormExpressionLang);
      //Create group expression language
      const groupExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath, "group-expression/build"),
        "group-expression",
        uid
      );
      const profileExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath, "profiles/build"),
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

      await sleep(10000);

      //Create link denoting type of community
      const addLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: "sioc://community",
        predicate: "rdf://type",
      });
      console.log("Added typelink with response", addLink);
      //TODO: we are sleeping here to ensure that all DNA's are installed before trying to do stuff
      //ideally installing DNA's in holochain would be a sync operation to avoid this

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
        profile.familyName,
        profile.profilePicture,
        profile.thumbnailPicture
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
      commit("addCommunity", {
        name: perspectiveName,
        description: description,
        linkLanguageAddress: publish.linkLanguages![0]!.address!,
        channels: [channel],
        perspective: createSourcePerspective.uuid!,
        expressionLanguages: expressionLangs,
        typedExpressionLanguages: typedExpLangs,
        groupExpressionRef: createExp,
        sharedPerspectiveUrl: communityPerspective.sharedURL!,
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
        commit("addExpressionUI", uiData);
        await sleep(40);
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
          profile.familyName,
          profile.profilePicture,
          profile.thumbnailPicture
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

      store.commit("addCommunity", {
        name: installedPerspective.name,
        linkLanguageAddress:
          installedPerspective.sharedPerspective!.linkLanguages![0]!.address!,
        channels: [],
        perspective: installedPerspective.uuid!,
        expressionLanguages:
          installedPerspective.sharedPerspective!.requiredExpressionLanguages,
        typedExpressionLanguages: typedExpressionLanguages,
        sharedPerspectiveUrl: joiningLink, //TODO: this will have to be string split once we add proof onto the URL
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

    getLanguagePath(state: State) {
      return state.localLanguagesPath;
    },

    getCommunity: (state) => (id: string) => {
      const community = state.communities.find(
        (community) => community.perspective === id
      );

      return community;
    },

    getChannel: (state) => (payload: any) => {
      const { channelId, communityId } = payload;
      const community = state.communities.find(
        (community: CommunityState) => community.perspective === communityId
      );

      return community?.channels.find(
        (channel) => channel.perspective === channelId
      );
    },

    getDatabasePerspective(state: State) {
      return state.databasePerspective;
    },

    getPerspectiveFromLinkLanguage: (state) => (linkLanguage: string) => {
      let perspective;
      state.communities.forEach((community) => {
        //@ts-ignore
        if (community.linkLanguageAddress == linkLanguage) {
          return community;
        }
        //@ts-ignore
        community.channels.forEach((channel) => {
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
        community.expressionLanguages.forEach((expLang) => {
          if (
            expressionLangs.indexOf(expLang) === -1 &&
            //@ts-ignore
            state.expressionUI.find(
              (val: ExpressionUIIcons) => val.languageAddress === expLang
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
