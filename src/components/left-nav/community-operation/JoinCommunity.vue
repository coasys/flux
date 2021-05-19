<template>
  <teleport to="body">
    <div class="joinCommunity">
      <div class="joinCommunity__dialog">
        <div class="joinCommunity__dialog--top">
          <div class="joinCommunity__dialog--title">
            <h2 class="joinCommunity__dialog--title--text">
              Join A New Community
            </h2>
            <div
              class="joinCommunity__dialog--title--container"
              @click="showJoinCommunity"
            >
              <svg class="joinCommunity__dialog--title--icon">
                <use href="@/assets/icons/icons.svg#cancel"></use>
              </svg>
            </div>
          </div>
        </div>

        <text-field-full
          maxLength="500"
          title="Link"
          description="Joining Link Here"
          v-model="joiningLink"
        ></text-field-full>
        <spacer></spacer>
        <div class="joinCommunity__dialog--bottom">
          <join-button @click="joinCommunity"></join-button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import TextFieldFull from "../../ui/textfields/TextFieldFull.vue";
import JoinButton from "../../ui/buttons/JoinButton.vue";
import Spacer from "../../ui/spacer/Spacer.vue";
import {
  ExpressionReference,
  ExpressionTypes,
  ExpressionUIIcons,
} from "@/store";
import { getLanguage } from "@/core/queries/getLanguage";
import { installSharedPerspective } from "@/core/mutations/installSharedPerspective";
import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";

export default defineComponent({
  setup() {
    const joiningLink = ref("");

    return {
      joiningLink,
    };
  },
  methods: {
    sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async joinCommunity() {
      let installedPerspective = await installSharedPerspective(
        this.joiningLink
      );
      console.log(
        new Date(),
        "Installed perspective raw data",
        installedPerspective
      );

      let typedExpressionLanguages = [];
      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      for (const lang of installedPerspective.sharedPerspective!
        .requiredExpressionLanguages!) {
        console.log("JoinCommunity.vue: Fetching UI lang:", lang);
        let languageRes = await getLanguage(lang!);
        let uiData: ExpressionUIIcons = {
          languageAddress: lang!,
          createIcon: languageRes.constructorIcon!.code!,
          viewIcon: languageRes.iconFor!.code!,
        };
        this.$store.commit({
          type: "addExpressionUI",
          value: uiData,
        });
        let expressionType;
        switch (languageRes.name!) {
          case "junto-shortform":
            expressionType = ExpressionTypes.ShortForm;
            break;

          case "group-expression":
            expressionType = ExpressionTypes.GroupExpression;
            break;

          case "agent-profiles":
            expressionType = ExpressionTypes.ProfileExpression;
            break;

          default:
            expressionType = ExpressionTypes.Other;
        }
        typedExpressionLanguages.push({
          languageAddress: lang!,
          expressionType: expressionType,
        } as ExpressionReference);
        //await this.sleep(40);
      }

      let profileExpLang = typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.ProfileExpression
      );
      if (profileExpLang != undefined) {
        //TODO: populate this data from the store
        let createProfileExpression = await createProfile(
          profileExpLang.languageAddress!,
          "username",
          "email",
          "givenName",
          "familyName"
        );

        //Create link between perspective and group expression
        let addProfileLink = await createLink(installedPerspective.uuid!, {
          source: `${installedPerspective.sharedPerspective!.linkLanguages![0]!
            .address!}://self`,
          target: createProfileExpression,
          predicate: "sioc://has_member",
        });
        console.log("Created group expression link", addProfileLink);
      }

      this.$store.commit({
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
        },
      });

      this.showJoinCommunity!();
    },
  },
  props: {
    showJoinCommunity: Function,
  },
  components: {
    TextFieldFull,
    Spacer,
    JoinButton,
  },
});
</script>

<style lang="scss">
@import "../../../assets/sass/main.scss";
.joinCommunity {
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
