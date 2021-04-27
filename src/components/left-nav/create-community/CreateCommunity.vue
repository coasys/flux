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
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import TextFieldFull from "../../ui/textfields/TextFieldFull.vue";
import CreateButton from "../../ui/buttons/CreateButton.vue";
import Spacer from "../../ui/spacer/Spacer.vue";
import {
  CREATE_UNIQUE_EXPRESSION_LANGUAGE,
  PUBLISH_PERSPECTIVE,
  ADD_PERSPECTIVE,
  ADD_LINK,
  CREATE_EXPRESSION,
  PUB_KEY_FOR_LANG,
  PERSPECTIVE,
} from "../../../core/graphql_queries";
import { useMutation, useQuery } from "@vue/apollo-composable";
import ad4m from "ad4m-core-executor";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FeedType } from "../../../store";

export default defineComponent({
  setup() {
    //TODO: I hate this code block here, needs to be refactored
    const languagePath = ref("");
    const dnaNick = ref("");
    const encrypt = ref(false);
    const passphrase = ref("");
    const perspectiveName = ref("");
    const description = ref("");
    const perspectiveUuid = ref("");
    const expressionLangs = ref([""]);
    const linkData = ref({});
    const groupExpressionLangHash = ref("");
    const groupExpression = ref({
      name: perspectiveName,
      description: description,
    });
    const currentQueryLang = ref("");
    const sharedPerspectiveType = ref("holochain");

    //TODO: setup error handlers for all error variants below
    const {
      mutate: createUniqueExprLang,
      error: createUniqueExprLangError,
    } = useMutation<{
      createUniqueHolochainExpressionLanguageFromTemplate: ad4m.LanguageRef;
    }>(CREATE_UNIQUE_EXPRESSION_LANGUAGE, () => ({
      variables: {
        languagePath: languagePath.value,
        dnaNick: dnaNick.value,
        encrypt: encrypt.value,
        passphrase: passphrase.value,
      },
    }));

    const { mutate: addPerspective, error: addPerspectiveError } = useMutation<{
      addPerspective: ad4m.Perspective;
    }>(ADD_PERSPECTIVE, () => ({
      variables: {
        name: perspectiveName.value,
      },
    }));

    const {
      mutate: publishSharedPerspective,
      error: publishSharedPerspectiveError,
    } = useMutation<{ publishPerspective: ad4m.SharedPerspective }>(
      PUBLISH_PERSPECTIVE,
      () => ({
        variables: {
          uuid: perspectiveUuid.value,
          name: perspectiveName.value,
          description: description.value,
          type: sharedPerspectiveType.value,
          encrypt: false,
          passphrase: passphrase.value,
          requiredExpressionLanguages: expressionLangs.value,
          allowedExpressionLanguages: expressionLangs.value,
        },
      })
    );

    const { mutate: addLink, error: addLinkError } = useMutation<{
      addLink: ad4m.LinkExpression;
    }>(ADD_LINK, () => ({
      variables: {
        perspectiveUUID: perspectiveUuid.value,
        link: JSON.stringify(linkData.value),
      },
    }));

    const {
      mutate: createExpression,
      error: createExpressionError,
    } = useMutation<{ createExpression: string }>(CREATE_EXPRESSION, () => ({
      variables: {
        languageAddress: groupExpressionLangHash.value,
        content: JSON.stringify(groupExpression.value),
      },
    }));

    const { query: pubKeyForLang, error: pubKeyForLangError } = useQuery<{
      pubKeyForLanguage: string;
    }>(PUB_KEY_FOR_LANG, { lang: currentQueryLang.value });

    const { query: getPerspective, error: getPerspectiveError } = useQuery<{
      perspective: ad4m.Perspective;
    }>(PERSPECTIVE, () => ({
      uuid: perspectiveUuid.value,
    }));

    return {
      createUniqueExprLang,
      createUniqueExprLangError,
      addPerspective,
      addPerspectiveError,
      publishSharedPerspective,
      publishSharedPerspectiveError,
      addLink,
      addLinkError,
      createExpression,
      createExpressionError,
      pubKeyForLang,
      pubKeyForLangError,
      getPerspective,
      getPerspectiveError,
      languagePath,
      dnaNick,
      encrypt,
      passphrase,
      perspectiveName,
      perspectiveUuid,
      description,
      expressionLangs,
      linkData,
      groupExpressionLangHash,
      currentQueryLang,
      sharedPerspectiveType,
    };
  },
  methods: {
    async createUniqueExpressionDNA(path: string, dnaNick: string) {
      this.languagePath = path;
      this.dnaNick = dnaNick;

      return await this.createUniqueExprLang();
    },

    getPubKeyForLang(lang: string): Promise<string> {
      this.currentQueryLang = lang;
      return new Promise((resolve, reject) => {
        this.pubKeyForLang.result().then((result) => {
          resolve(result.data.pubKeyForLanguage);
        });
      });
    },

    createUniqueExprDNA(path: string, name: string): Promise<ad4m.LanguageRef> {
      return new Promise((resolve, reject) => {
        this.createUniqueExpressionDNA(path, name).then((createExpResp) => {
          resolve(
            createExpResp.data!
              .createUniqueHolochainExpressionLanguageFromTemplate
          );
        });
      });
    },

    publishSharedPerspectiveMethod(): Promise<ad4m.SharedPerspective> {
      return new Promise((resolve, reject) => {
        this.publishSharedPerspective().then((publishPersp) => {
          resolve(publishPersp.data!.publishPerspective);
        });
      });
    },

    createLink(link: ad4m.Link): Promise<ad4m.LinkExpression> {
      this.linkData = link;
      return new Promise((resolve, reject) => {
        this.addLink().then((addLinkResp) => {
          resolve(addLinkResp.data!.addLink);
        });
      });
    },

    createExpressionMethod(): Promise<string> {
      return new Promise((resolve, reject) => {
        this.createExpression().then((createExp) => {
          resolve(createExp.data!.createExpression);
        });
      });
    },

    createPerspectiveMethod(): Promise<ad4m.Perspective> {
      return new Promise((resolve, reject) => {
        this.addPerspective().then((addPerspective) => {
          resolve(addPerspective.data!.addPerspective);
        });
      });
    },

    getPerspectiveMethod(): Promise<ad4m.Perspective> {
      return new Promise((resolve, reject) => {
        this.getPerspective.refetch().then((getPerspective) => {
          resolve(getPerspective.data!.perspective);
        });
      });
    },

    sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async createCommunity() {
      //TODO: @eric: show loading animation here
      let createPerspective = await this.createPerspectiveMethod();
      console.log("Created perspective", createPerspective);
      this.perspectiveUuid = createPerspective.uuid!;
      this.passphrase = uuidv4().toString();
      var builtInLangPath = this.$store.getters.getLanguagePath;

      //Create shortform expression language
      let expressionLang = await this.createUniqueExprDNA(
        path.join(builtInLangPath.value, "shortform/build"),
        "shortform"
      );
      console.log("Response from create exp lang", expressionLang);
      this.expressionLangs = [expressionLang.address!];

      //Create group expression language
      let groupExpressionLang = await this.createUniqueExprDNA(
        path.join(builtInLangPath.value, "group-expression/build"),
        "group-expression"
      );
      console.log("Response from create exp lang", groupExpressionLang);
      this.groupExpressionLangHash = groupExpressionLang.address!;
      this.expressionLangs.push(groupExpressionLang.address!);

      //Publish perspective
      let publish = await this.publishSharedPerspectiveMethod();
      console.log("Published perspective with response", publish);

      //Create link denoting type of community
      //TODO: this things should be abstracted into their own high level function with type safety for given contexts
      //This would avoid re-writing the same link logic as well as allow for easy changing of link logic
      let addLink = await this.createLink({
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: "foaf://group",
        predicate: "rdf://type",
      });
      console.log("Added typelink with response", addLink);
      await this.sleep(200);

      //Create the group expression
      let createExp = await this.createExpressionMethod();
      console.log("Created group expression with response", createExp);

      //Create link between perspective and group expression
      let addGroupExpLink = await this.createLink({
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: createExp,
        predicate: "rdf://class",
      });
      console.log("Created group expression link", addGroupExpLink);

      //Next steps: create another perspective + share with social-context-channel link language and add above expression DNA's onto it
      //Then create link from source social context pointing to newly created SharedPerspective w/appropriate predicate to denote its a dm channel
      //This logic and the above logic should be in their own functions, for now its monolithic
      let channelPerspective = await this.createPerspectiveMethod();
      console.log(
        "Created channel perspective with result",
        channelPerspective
      );
      this.perspectiveUuid = channelPerspective.uuid!;
      //TODO: add channel expression language here
      this.expressionLangs = [expressionLang.address!];
      this.perspectiveName = this.perspectiveName + " Default Message Channel";
      this.sharedPerspectiveType = "holochainChannel";

      //Publish the perspective and add a social-context backend
      let shareChannelPerspective = await this.publishSharedPerspectiveMethod();
      console.log(
        "Shared channel perspective with result",
        shareChannelPerspective
      );

      //Get the perspective again so that we have the SharedPerspective URL
      let perspective = await this.getPerspectiveMethod();
      console.log("Got the channel perspective back with result", perspective);

      //Set the perspectiveUUID in question back to original
      this.perspectiveUuid = createPerspective.uuid!;
      //Link from source social context to new sharedperspective
      let addLinkToChannel = await this.createLink({
        source: createExp,
        target: perspective.sharedURL!,
        predicate: "sioc://has_space",
      });
      console.log(
        "Added link from source social context to new SharedPerspective with result",
        addLinkToChannel
      );

      //Reset perspectiveUuid back to channels
      this.perspectiveUuid = channelPerspective.uuid!;

      //Note this is temporary code to check the functioning of signals; but it should actually remain in the logic later on
      let channelScPubKey = await this.getPubKeyForLang(
        shareChannelPerspective.linkLanguages![0]!.address!
      );
      console.log("Got pub key for social context channel", channelScPubKey);
      let addActiveAgentLink = await this.createLink({
        source: "active_agent",
        target: channelScPubKey,
        predicate: "*",
      });
      console.log("Created active agent link with result", addActiveAgentLink);

      //Add link on channel social context declaring type
      let addChannelTypeLink = await this.createLink({
        source: `${shareChannelPerspective.linkLanguages![0]!.address!}://self`,
        target: "sioc://space",
        predicate: "rdf://type",
      });
      console.log(
        "Added link on channel social context with result",
        addChannelTypeLink
      );

      //Add the perspective to community store
      this.$store.commit({
        type: "addCommunity",
        value: {
          name: this.perspectiveName,
          channels: [
            {
              name: channelPerspective.name!,
              perspective: channelPerspective.uuid!,
              type: FeedType.Dm,
            },
          ],
          perspective: this.perspectiveUuid,
          expressionLanguages: this.expressionLangs,
        },
      });
      this.$store.commit({
        type: "changeCommunityView",
        value: { name: "main", type: FeedType.Feed },
      });

      this.showCreateCommunity!();
    },
  },
  components: {
    TextFieldFull,
    CreateButton,
    Spacer,
  },
  props: {
    showCreateCommunity: Function,
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
