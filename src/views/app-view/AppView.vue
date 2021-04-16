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
import { CREATE_UNIQUE_EXPRESSION_LANGUAGE } from "../../core/graphql_queries";
import { useQuery, useResult, useMutation } from "@vue/apollo-composable";
//import { builtInLangPath } from "../../background";
import { v4 as uuidv4 } from "uuid";
import ad4m from "ad4m-core-executor";

export default defineComponent({
  name: "MainAppView",
  setup() {
    const languagePath = ref("");
    const dnaNick = ref("");
    const encrypt = ref(false);
    const passphrase = ref("");
    const {
      mutate: createUniqueExprLang,
      error: createUniqueExprLangError,
    } = useMutation<{
      createUniqueHolochainExpressionLanguageFromTemplate: string;
    }>(CREATE_UNIQUE_EXPRESSION_LANGUAGE, () => ({
      variables: {
        languagePath: languagePath.value,
        dnaNick: dnaNick.value,
        encrypt: encrypt.value,
        passphrase: passphrase.value,
      },
    }));

    return {
      createUniqueExprLang,
      createUniqueExprLangError,
      languagePath,
      dnaNick,
      encrypt,
      passphrase,
    };
  },
  mounted() {
    var builtInLangPath = this.$store.getters.getLanguagePath;
    //TODO iterate over langs in src/core/junto-langs.ts and create those vs hard code short form
    this.languagePath = path.join(builtInLangPath.value, "shortform/build");
    this.dnaNick = "shortform";
    this.passphrase = uuidv4().toString();
    let createExp = this.createUniqueExprLang();
    createExp.then((createExpResp) => {
      console.log("Response from create exp lang", createExpResp);
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
