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
            v-bind="perspectiveName"
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
          <create-button @click="createPerspective"></create-button>
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
} from "../../../core/graphql_queries";
import { useMutation } from "@vue/apollo-composable";
import ad4m from "ad4m-core-executor";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FeedType } from "../../../store";

export default defineComponent({
  setup() {
    const languagePath = ref("");
    const dnaNick = ref("");
    const encrypt = ref(false);
    const passphrase = ref("");
    const perspectiveName = ref("");
    const description = ref("");
    const perspectiveUuid = ref("");
    const expressionLangs = ref([""]);
    const linkData = ref({});

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
          type: "holochain",
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

    return {
      createUniqueExprLang,
      createUniqueExprLangError,
      addPerspective,
      addPerspectiveError,
      publishSharedPerspective,
      publishSharedPerspectiveError,
      addLink,
      addLinkError,
      languagePath,
      dnaNick,
      encrypt,
      passphrase,
      perspectiveName,
      perspectiveUuid,
      description,
      expressionLangs,
      linkData,
    };
  },
  methods: {
    createPerspective() {
      //TODO: @eric: show loading animation here
      this.addPerspective().then((createPerspectiveResp) => {
        console.log("Response from create perpspective", createPerspectiveResp);
        this.perspectiveUuid = createPerspectiveResp.data!.addPerspective.uuid!;
        var builtInLangPath = this.$store.getters.getLanguagePath;
        //TODO iterate over langs in src/core/junto-langs.ts and create those vs hard code short form
        this.languagePath = path.join(builtInLangPath.value, "shortform/build");
        this.dnaNick = "shortform";
        this.passphrase = uuidv4().toString();

        this.createUniqueExprLang().then((createExpResp) => {
          console.log("Response from create exp lang", createExpResp);
          this.expressionLangs = [
            createExpResp.data!
              .createUniqueHolochainExpressionLanguageFromTemplate.address!,
          ];

          this.publishSharedPerspective().then((publishResp) => {
            console.log("Published perspective with response", publishResp);
            this.$store.commit({
              type: "addCommunity",
              value: {
                name: this.perspectiveName,
                channels: [],
                perspective: createPerspectiveResp.data?.addPerspective.uuid,
                expressionLanguages: [
                  createExpResp.data!
                    .createUniqueHolochainExpressionLanguageFromTemplate
                    .address!,
                ],
              },
            });
            this.$store.commit({
              type: "changeCommunityView",
              value: { name: "main", type: FeedType.Feed },
            });
            this.showCreateCommunity!();
            console.log(publishResp.data!.publishPerspective);

            //Now create default links & expressions for group
            this.linkData = {
              source: `${
                publishResp.data!.publishPerspective.linkLanguages![0]?.address
              }://self`,
              target: "foaf://group",
              predicate: "rdf://type",
            };
            this.addLink().then((addLinkResp) => {
              console.log("Added link with response", addLinkResp);
            });
          });
        });
      });
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
