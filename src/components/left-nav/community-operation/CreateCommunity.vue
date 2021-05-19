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
          <text-field-full
            maxLength="50"
            title="Description"
            description="Describe what your community is about."
            v-model="description"
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
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  ExpressionUIIcons,
  ExpressionReference,
  ExpressionTypes,
} from "@/store";
import { createChannel } from "@/core/methods/createChannel";
import { createProfile } from "@/core/methods/createProfile";
import { createExpression } from "@/core/mutations/createExpression";
import { createUniqueExpressionLanguage } from "@/core/mutations/createUniqueExpressionLanguage";
import { publishSharedPerspective } from "@/core/mutations/publishSharedPerspective";
import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { getLanguage } from "@/core/queries/getLanguage";

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
    sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    },

    async createCommunity() {
      //TODO: @eric: show loading animation here
      let createSourcePerspective = await addPerspective(this.perspectiveName);
      console.log("Created perspective", createSourcePerspective);
      this.uid = uuidv4().toString();

      var builtInLangPath = this.$store.getters.getLanguagePath;

      //Create shortform expression language
      let shortFormExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath.value, "shortform/build"),
        "shortform",
        this.uid
      );
      console.log("Response from create exp lang", shortFormExpressionLang);
      //Create group expression language
      let groupExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath.value, "group-expression/build"),
        "group-expression",
        this.uid
      );
      let profileExpressionLang = await createUniqueExpressionLanguage(
        path.join(builtInLangPath.value, "profiles/build"),
        "agent-profiles",
        this.uid
      );
      console.log("Response from create exp lang", groupExpressionLang);
      let expressionLangs = [
        shortFormExpressionLang.address!,
        groupExpressionLang.address!,
        profileExpressionLang.address!,
      ];

      //Publish perspective
      let publish = await publishSharedPerspective({
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
      let addLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: "sioc://community",
        predicate: "rdf://type",
      });
      console.log("Added typelink with response", addLink);
      //TODO: we are sleeping here to ensure that all DNA's are installed before trying to do stuff
      //ideally installing DNA's in holochain would be a sync operation to avoid this
      await this.sleep(5000);

      //Create the group expression
      let createExp = await createExpression(
        groupExpressionLang.address!,
        JSON.stringify({
          name: this.perspectiveName,
          description: this.description,
        })
      );
      console.log("Created group expression with response", createExp);

      //Create link between perspective and group expression
      let addGroupExpLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: createExp,
        predicate: "rdf://class",
      });
      console.log("Created group expression link", addGroupExpLink);

      //TODO: populate this data from the store
      let createProfileExpression = await createProfile(
        profileExpressionLang.address!,
        "username",
        "email",
        "givenName",
        "familyName"
      );

      //Create link between perspective and group expression
      let addProfileLink = await createLink(createSourcePerspective.uuid!, {
        source: `${publish.linkLanguages![0]!.address!}://self`,
        target: createProfileExpression,
        predicate: "sioc://has_member",
      });
      console.log("Created group expression link", addProfileLink);

      //Next steps: create another perspective + share with social-context-channel link language and add above expression DNA's onto it
      //Then create link from source social context pointing to newly created SharedPerspective w/appropriate predicate to denote its a dm channel
      let channel = await createChannel(
        "Default Message Channel",
        this.description,
        this.uid,
        createSourcePerspective.uuid!,
        publish.linkLanguages![0]!.address!,
        expressionLangs
      );

      //Add the perspective to community store
      this.$store.commit({
        type: "addCommunity",
        value: {
          name: this.perspectiveName,
          description: this.description,
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
            {
              languageAddress: profileExpressionLang.address!,
              expressionType: ExpressionTypes.ProfileExpression,
            } as ExpressionReference,
          ],
        },
      });

      //Get and cache the expression UI for each expression language
      for (const [, lang] of expressionLangs.entries()) {
        console.log("CreateCommunity.vue: Fetching UI lang:", lang);
        let languageRes = await getLanguage(lang);
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
