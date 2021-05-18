<template>
  <teleport to="body">
    <div class="createCommunity">
      <div class="createCommunity__dialog">
        <div class="createCommunity__dialog--top">
          <div class="createCommunity__dialog--title">
            <h2 class="createCommunity__dialog--title--text">
              Create a New Community
            </h2>
            <div
              class="createCommunity__dialog--title--container"
              @click="showCreateCommunity"
            >
              <svg class="createCommunity__dialog--title--icon">
                <use href="@/assets/icons/icons.svg#cancel"></use>
              </svg>
            </div>
          </div>
          <p class="createCommunity__dialog--description">
            Communities are the building blocks of Junto.
          </p>

          <text-field-full
            maxLength="50"
            title="Name"
            description="Name your community here"
            v-model="perspectiveName"
          ></text-field-full>
          <spacer></spacer>
          <text-field-full
            maxLength="22"
            title="Handle"
            description="Choose a handle for your community.
            Handles can contain letters, numbers, hypens, and underscores."
          ></text-field-full>
          <spacer></spacer>
          <h2 class="createCommunity__title">Privacy</h2>
          <select name="privacy" class="createCommunity__privacy">
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>
        </div>

        <div class="createCommunity__dialog--bottom">
          <create-button @click="createCommunity"></create-button>
        </div>
        <spacer></spacer>
        <div class="createCommunity__dialog--bottom">
          <join-button @click="openJoinView"></join-button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import TextFieldFull from "../../ui/textfields/TextFieldFull.vue";
import CreateButton from "../../ui/buttons/CreateButton.vue";
import JoinButton from "../../ui/buttons/JoinButton.vue";
import Spacer from "../../ui/spacer/Spacer.vue";
import {
  CREATE_UNIQUE_EXPRESSION_LANGUAGE,
  PUBLISH_PERSPECTIVE,
  ADD_PERSPECTIVE,
  ADD_LINK,
  CREATE_EXPRESSION,
  PUB_KEY_FOR_LANG,
  PERSPECTIVE,
  LANGUAGE,
} from "@/core/graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  FeedType,
  SyncLevel,
  ExpressionUIIcons,
  ChannelState,
  ExpressionReference,
  ExpressionTypes,
} from "@/store";
import { apolloClient } from "@/main";

export default defineComponent({
  setup() {
    //TODO: I hate this code block here, needs to be refactored
    const uid = ref("");
    const perspectiveName = ref("");
    const description = ref("");

    return {
      uid,
      perspectiveName,
      description,
    };
  },
  methods: {
    pubKeyForLanguage(lang: string): Promise<string> {
      return new Promise((resolve, reject) => {
        apolloClient
          .query<{ pubKeyForLanguage: string }>({
            query: PUB_KEY_FOR_LANG,
            variables: { lang: lang },
          })
          .then((result) => {
            resolve(result.data!.pubKeyForLanguage);
          })
          .catch((error) => reject(error));
      });
    },

    addPerspective(name: string): Promise<ad4m.Perspective> {
      return new Promise((resolve, reject) => {
        apolloClient
          .mutate<{
            addPerspective: ad4m.Perspective;
          }>({ mutation: ADD_PERSPECTIVE, variables: { name: name } })
          .then((result) => {
            resolve(result.data!.addPerspective);
          })
          .catch((error) => reject(error));
      });
    },

    createUniqueHolochainExpressionLanguageFromTemplate(
      languagePath: string,
      dnaNick: string,
      uid: string
    ): Promise<ad4m.LanguageRef> {
      return new Promise((resolve, reject) => {
        apolloClient
          .mutate<{
            createUniqueHolochainExpressionLanguageFromTemplate: ad4m.LanguageRef;
          }>({
            mutation: CREATE_UNIQUE_EXPRESSION_LANGUAGE,
            variables: {
              languagePath: languagePath,
              dnaNick: dnaNick,
              uid: uid,
            },
          })
          .then((result) => {
            resolve(
              result.data!.createUniqueHolochainExpressionLanguageFromTemplate
            );
          })
          .catch((error) => reject(error));
      });
    },

    publishSharedPerspective(
      sharedPerspective: ad4m.PublishPerspectiveInput
    ): Promise<ad4m.SharedPerspective> {
      return new Promise((resolve, reject) => {
        apolloClient
          .mutate<{ publishPerspective: ad4m.SharedPerspective }>({
            mutation: PUBLISH_PERSPECTIVE,
            variables: sharedPerspective,
          })
          .then((result) => {
            resolve(result.data!.publishPerspective);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    createLink(
      perspective: string,
      link: ad4m.Link
    ): Promise<ad4m.LinkExpression> {
      return new Promise((resolve, reject) => {
        apolloClient
          .mutate<{ addLink: ad4m.LinkExpression }>({
            mutation: ADD_LINK,
            variables: {
              perspectiveUUID: perspective,
              link: JSON.stringify(link),
            },
          })
          .then((result) => {
            resolve(result.data!.addLink);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    createExpression(
      languageAddress: string,
      content: string
    ): Promise<string> {
      return new Promise((resolve, reject) => {
        apolloClient
          .mutate<{ createExpression: string }>({
            mutation: CREATE_EXPRESSION,
            variables: {
              languageAddress: languageAddress,
              content: content,
            },
          })
          .then((result) => {
            resolve(result.data!.createExpression);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    getPerspective(uuid: string): Promise<ad4m.Perspective> {
      return new Promise((resolve, reject) => {
        apolloClient
          .query<{ perspective: ad4m.Perspective }>({
            query: PERSPECTIVE,
            variables: { uuid: uuid },
          })
          .then((result) => {
            resolve(result.data!.perspective);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    getLanguage(language: string): Promise<ad4m.Language> {
      return new Promise((resolve, reject) => {
        apolloClient
          .query<{ language: ad4m.Language }>({
            query: LANGUAGE,
            variables: { address: language },
          })
          .then((result) => {
            resolve(result.data!.language);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    },

    //Creates a channel but creating and publishing perspectives and then links to channel from source perspective as defined by input arguments
    async createChannel(
      sourcePerspective: string,
      sourcePerspectiveLinkLanguage: string,
      expressionLangs: string[]
    ): Promise<ChannelState> {
      let channelPerspective = await this.addPerspective(
        "Default Message Channel"
      );
      console.log(
        "Created channel perspective with result",
        channelPerspective
      );

      //Publish the perspective and add a social-context backend
      let shareChannelPerspective = await this.publishSharedPerspective({
        uuid: channelPerspective.uuid!,
        name: "Default Message Channel",
        description: this.description,
        type: "holochainChannel",
        uid: this.uid,
        requiredExpressionLanguages: expressionLangs,
        allowedExpressionLanguages: expressionLangs,
      });
      console.log(
        "Shared channel perspective with result",
        shareChannelPerspective
      );

      //Get the perspective again so that we have the SharedPerspective URL
      let perspective = await this.getPerspective(channelPerspective.uuid!);
      console.log("Got the channel perspective back with result", perspective);

      //Link from source social context to new sharedperspective
      let addLinkToChannel = await this.createLink(sourcePerspective, {
        source: `${sourcePerspectiveLinkLanguage}://self`,
        target: perspective.sharedURL!,
        predicate: "sioc://has_space",
      });
      console.log(
        "Added link from source social context to new SharedPerspective with result",
        addLinkToChannel
      );

      //Add link on channel social context declaring type
      let addChannelTypeLink = await this.createLink(channelPerspective.uuid!, {
        source: `${shareChannelPerspective.linkLanguages![0]!.address!}://self`,
        target: "sioc://space",
        predicate: "rdf://type",
      });
      console.log(
        "Added link on channel social context with result",
        addChannelTypeLink
      );

      let now = new Date();
      return {
        name: channelPerspective.name!,
        perspective: channelPerspective.uuid!,
        type: FeedType.Dm,
        lastSeenMessageTimestamp: now,
        firstSeenMessageTimestamp: now,
        createdAt: now,
        linkLanguageAddress:
          shareChannelPerspective.linkLanguages![0]!.address!,
        syncLevel: SyncLevel.Full,
        maxSyncSize: -1,
        currentExpressionLinks: [],
        currentExpressionMessages: [],
        sharedPerspectiveUrl: perspective.sharedURL!,
      };
    },

    async createCommunity() {
      //TODO: @eric: show loading animation here
      let createSourcePerspective = await this.addPerspective(
        this.perspectiveName
      );
      console.log("Created perspective", createSourcePerspective);
      this.uid = uuidv4().toString();

      var builtInLangPath = this.$store.getters.getLanguagePath;

      //Create shortform expression language
      let shortFormExpressionLang =
        await this.createUniqueHolochainExpressionLanguageFromTemplate(
          path.join(builtInLangPath.value, "shortform/build"),
          "shortform",
          this.uid
        );
      console.log("Response from create exp lang", shortFormExpressionLang);
      //Create group expression language
      let groupExpressionLang =
        await this.createUniqueHolochainExpressionLanguageFromTemplate(
          path.join(builtInLangPath.value, "group-expression/build"),
          "group-expression",
          this.uid
        );
      console.log("Response from create exp lang", groupExpressionLang);
      let expressionLangs = [
        shortFormExpressionLang.address!,
        groupExpressionLang.address!,
      ];

      //Publish perspective
      let publish = await this.publishSharedPerspective({
        uuid: createSourcePerspective.uuid!,
        name: this.perspectiveName,
        description: this.description,
        type: "holochain",
        uid: this.uid,
        requiredExpressionLanguages: expressionLangs,
        allowedExpressionLanguages: expressionLangs,
      });
      console.log("Published perspective with response", publish);

      //Create link denoting type of community
      let addLink = await this.createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: "foaf://group",
        predicate: "rdf://type",
      });
      console.log("Added typelink with response", addLink);
      await this.sleep(200);

      //Create the group expression
      let createExp = await this.createExpression(
        groupExpressionLang.address!,
        JSON.stringify({
          name: this.perspectiveName,
          description: this.description,
        })
      );
      console.log("Created group expression with response", createExp);

      //Create link between perspective and group expression
      let addGroupExpLink = await this.createLink(
        createSourcePerspective.uuid!,
        {
          source: `${publish.linkLanguages![0]!.address!}://self`,
          target: createExp,
          predicate: "rdf://class",
        }
      );
      console.log("Created group expression link", addGroupExpLink);

      //Next steps: create another perspective + share with social-context-channel link language and add above expression DNA's onto it
      //Then create link from source social context pointing to newly created SharedPerspective w/appropriate predicate to denote its a dm channel
      let channel = await this.createChannel(
        createSourcePerspective.uuid!,
        publish.linkLanguages![0]!.address!,
        [shortFormExpressionLang.address!]
      );

      //Add the perspective to community store
      this.$store.commit({
        type: "addCommunity",
        value: {
          name: this.perspectiveName,
          linkLanguageAddress: publish.linkLanguages![0]!.address!,
          channels: [channel],
          perspective: createSourcePerspective.uuid!,
          expressionLanguages: expressionLangs,
          typedExpressionLanguages: [
            {
              languageAddress: shortFormExpressionLang.address!,
              expressionType: ExpressionTypes.ShortForm,
            } as ExpressionReference,
            {
              languageAddress: groupExpressionLang.address!,
              expressionType: ExpressionTypes.GroupExpression,
            } as ExpressionReference,
          ],
        },
      });

      //Get and cache the expression UI for each expression language
      for (const [, lang] of expressionLangs.entries()) {
        console.log("CreateCommunity.vue: Fetching UI lang:", lang);
        let languageRes = await this.getLanguage(lang);
        let uiData: ExpressionUIIcons = {
          languageAddress: lang,
          createIcon: languageRes.constructorIcon!.code!,
          viewIcon: languageRes.iconFor!.code!,
        };
        this.$store.commit({
          type: "addExpressionUI",
          value: uiData,
        });
        await this.sleep(40);
      }

      this.showCreateCommunity!();
    },

    openJoinView() {
      this.showCreateCommunity!();
      this.showJoinCommunity!();
    },
  },
  components: {
    TextFieldFull,
    CreateButton,
    Spacer,
    JoinButton,
  },
  props: {
    showCreateCommunity: Function,
    showJoinCommunity: Function,
  },
});
</script>

<style lang="scss">
@import "../../../assets/sass/main.scss";
.createCommunity {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  &__title {
    font-size: 1.7rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  &__privacy {
    outline: none;
    border: 1px solid var(--junto-border-color);
    background-color: var(--junto-background-color);
    padding: 0.5rem 1rem;
    font-size: 1.4rem;
    font-weight: 500;
    margin-bottom: 2rem;
    color: var(--junto-primary);
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    &:hover {
      cursor: pointer;
    }
  }
  &__dialog {
    max-width: 33vw;
    background-color: var(--junto-background-color);
    border-radius: 25px;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 40rem;
    &--title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      &--text {
        font-size: 2.8rem;
        font-weight: 700;
      }
      &--container {
        background-color: transparent;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        &:hover {
          cursor: pointer;
        }
      }
      &--icon {
        height: 3rem;
        width: 3rem;
        fill: var(--junto-primary);
      }
    }
    &--description {
      font-size: 1.6rem;
      font-weight: 500;
      color: var(--junto-primary-medium);
      margin-bottom: 3rem;
    }
  }
}
</style>
