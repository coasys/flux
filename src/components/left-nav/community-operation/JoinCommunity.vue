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
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import {
  QUERY_EXPRESSION,
  INSTALL_SHARED_PERSPECTIVE,
  SOURCE_PREDICATE_LINK_QUERY,
  ADD_LINK,
  PUB_KEY_FOR_LANG,
  LANGUAGE,
} from "@/core/graphql_queries";
import SharedPerspective from "@perspect3vism/ad4m/SharedPerspective";
import {
  ExpressionReference,
  ExpressionTypes,
  ExpressionUIIcons,
} from "@/store";
import { apolloClient } from "@/main";
import ad4m from "@perspect3vism/ad4m-executor";

export default defineComponent({
  setup() {
    const joiningLink = ref("");
    const perspectiveUrl = ref("");
    const sharedPerspective = ref({});
    const sourceLinkLanguage = ref("");
    const installedSourcePerspectiveUUID = ref("");
    const perspectiveUuid = ref("");
    const linkData = ref({});
    const currentQueryLang = ref("");

    //Query expression handke
    const getExpression = useLazyQuery<{ expression: ad4m.Expression }>(
      QUERY_EXPRESSION,
      () => ({
        url: joiningLink.value,
      }),
      { fetchPolicy: "network-only" }
    );

    const getChatChannelLinks = useLazyQuery<{ links: ad4m.LinkExpression[] }>(
      SOURCE_PREDICATE_LINK_QUERY,
      () => ({
        perspectiveUUID: installedSourcePerspectiveUUID.value,
        source: `${sourceLinkLanguage.value}://self`,
        predicate: "sioc://has_space",
      })
    );

    const installSharedPerspective = useMutation<{
      installSharedPerspective: ad4m.Perspective;
    }>(INSTALL_SHARED_PERSPECTIVE, () => ({
      variables: {
        sharedPerspectiveUrl: perspectiveUrl.value,
        sharedPerspective: sharedPerspective.value,
      },
    }));

    const { mutate: addLink, error: addLinkError } = useMutation<{
      addLink: ad4m.LinkExpression;
    }>(ADD_LINK, () => ({
      variables: {
        perspectiveUUID: perspectiveUuid.value,
        link: JSON.stringify(linkData.value),
      },
    }));

    const pubKeyForLang = useLazyQuery<{
      pubKeyForLanguage: string;
    }>(PUB_KEY_FOR_LANG, () => ({ lang: currentQueryLang.value }));

    return {
      getExpression,
      joiningLink,
      perspectiveUrl,
      sharedPerspective,
      installSharedPerspective,
      getChatChannelLinks,
      installedSourcePerspectiveUUID,
      sourceLinkLanguage,
      addLink,
      addLinkError,
      perspectiveUuid,
      linkData,
      pubKeyForLang,
      currentQueryLang,
    };
  },
  methods: {
    getExpressionMethod(): Promise<ad4m.Expression> {
      return new Promise((resolve, reject) => {
        this.getExpression.onResult((result) => {
          resolve(result.data!.expression);
        });
        this.getExpression.onError((error) => {
          console.log("Got error", error);
          reject(error);
        });
        this.getExpression.load();
      });
    },
    getChannelLinks(): Promise<ad4m.LinkExpression[]> {
      return new Promise((resolve, reject) => {
        this.getChatChannelLinks.onResult((result) => {
          resolve(result.data.links);
        });
        this.getChatChannelLinks.onError((error) => {
          console.log("Got error getting channel links", error);
          reject(error);
        });
        this.getChatChannelLinks.load();
      });
    },
    installSharedPerspectiveMethod(
      url: string,
      perspective: SharedPerspective
    ): Promise<ad4m.Perspective> {
      this.perspectiveUrl = url;
      this.sharedPerspective = perspective;
      return new Promise((resolve, reject) => {
        this.installSharedPerspective.onError((error) => {
          console.log("Install sharedPerspective got error", error);
          reject(error);
        });
        this.installSharedPerspective.mutate().then((result) => {
          resolve(result.data!.installSharedPerspective);
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

    getPubKeyForLang(lang: string): Promise<string> {
      this.currentQueryLang = lang;
      return new Promise((resolve, reject) => {
        this.pubKeyForLang.onResult((result) => {
          resolve(result.data.pubKeyForLanguage);
        });
        this.pubKeyForLang.onError((error) => {
          console.log("Got error in getPubKeyForLang", error);
          reject(error);
        });
        this.pubKeyForLang.load();
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

    async joinCommunity() {
      //TODO: fix all types here and remove ts-ignores
      console.log(this.joiningLink);
      let sharedPerspectiveExp = await this.getExpressionMethod();
      let sharedPerspective: SharedPerspective = JSON.parse(
        sharedPerspectiveExp.data!
      );
      //TODO: check that the perspective is not already installed
      let installedPerspective = await this.installSharedPerspectiveMethod(
        this.joiningLink,
        sharedPerspective
      );
      console.log(
        new Date(),
        "Installed perspective raw data",
        installedPerspective
      );
      this.installedSourcePerspectiveUUID = installedPerspective.uuid!;
      this.sourceLinkLanguage =
        installedPerspective.sharedPerspective!.linkLanguages![0]!.address!;

      let typedExpressionLanguages = [];
      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      for (const lang of installedPerspective.sharedPerspective!
        .requiredExpressionLanguages!) {
        console.log("JoinCommunity.vue: Fetching UI lang:", lang);
        let languageRes = await this.getLanguage(lang!);
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

          default:
            expressionType = ExpressionTypes.Other;
        }
        typedExpressionLanguages.push({
          languageAddress: lang!,
          expressionType: expressionType,
        } as ExpressionReference);
        await this.sleep(40);
      }

      this.$store.commit({
        type: "addCommunity",
        value: {
          name: installedPerspective.name,
          linkLanguageAddress: this.sourceLinkLanguage,
          channels: [],
          perspective: this.installedSourcePerspectiveUUID,
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
