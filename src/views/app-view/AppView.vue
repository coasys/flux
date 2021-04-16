<template>
  <div class="app-view">
    <left-nav></left-nav>
    <community-view></community-view>
  </div>
</template>

<script lang="ts">
import LeftNav from "./../../components/left-nav/LeftNav.vue";
import CommunityView from "./../community-view/CommunityView.vue";

import path from "path";
import { defineComponent, ref } from "vue";
import {
  CREATE_UNIQUE_EXPRESSION_LANGUAGE,
  PUBLISH_PERSPECTIVE,
  ADD_PERSPECTIVE,
} from "../../core/graphql_queries";
import { useMutation } from "@vue/apollo-composable";
import { v4 as uuidv4 } from "uuid";
import ad4m from "ad4m-core-executor";

export default defineComponent({
  name: "MainAppView",
  setup() {
    const languagePath = ref("");
    const dnaNick = ref("");
    const encrypt = ref(false);
    const passphrase = ref("");
    const perspectiveName = ref("");
    const description = ref("");
    const perspectiveUuid = ref("");
    const expressionLangs = ref([""]);
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
    } = useMutation<{ pubishPerspective: ad4m.SharedPerspective }>(
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

    return {
      createUniqueExprLang,
      createUniqueExprLangError,
      addPerspective,
      addPerspectiveError,
      publishSharedPerspective,
      publishSharedPerspectiveError,
      languagePath,
      dnaNick,
      encrypt,
      passphrase,
      perspectiveName,
      perspectiveUuid,
      description,
      expressionLangs,
    };
  },
  mounted() {
    this.perspectiveName = "Test Perspective";
    this.description = "My test perspective";
    let createPerspective = this.addPerspective();

    createPerspective.then((createPerspectiveResp) => {
      console.log("Response from create perpspective", createPerspectiveResp);
      this.perspectiveUuid = createPerspectiveResp.data!.addPerspective.uuid!;
      var builtInLangPath = this.$store.getters.getLanguagePath;
      //TODO iterate over langs in src/core/junto-langs.ts and create those vs hard code short form
      this.languagePath = path.join(builtInLangPath.value, "shortform/build");
      this.dnaNick = "shortform";
      this.passphrase = uuidv4().toString();
      let createExp = this.createUniqueExprLang();

      createExp.then((createExpResp) => {
        console.log("Response from create exp lang", createExpResp);
        this.expressionLangs = [
          createExpResp.data!
            .createUniqueHolochainExpressionLanguageFromTemplate.address!,
        ];
        let publishPerspective = this.publishSharedPerspective();

        publishPerspective.then((publishResp) => {
          console.log("Published perspective with response", publishResp);
        });
      });
    });
  },
  components: {
    LeftNav,
    CommunityView,
  },
});
</script>

<style lang="scss" scoped>
.app-view {
  height: 100vh;
  max-height: 100vh;
  width: 100%;
  display: flex;
}
</style>
