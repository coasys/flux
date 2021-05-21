<template>
  <div>
    <text-field-full
      maxLength="50"
      title="Name"
      description="Name your community here"
      v-model="perspectiveName"
    ></text-field-full>
    <spacer></spacer>
  </div>
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
  <div class="createCommunity__dialog--bottom">
    <create-button @click="createCommunity"></create-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  ExpressionUIIcons,
  JuntoExpressionReference,
  ExpressionTypes,
  Profile,
  MembraneType,
} from "@/store";
import { createChannel } from "@/core/methods/createChannel";
import { createProfile } from "@/core/methods/createProfile";
import { createExpression } from "@/core/mutations/createExpression";
import { createUniqueExpressionLanguage } from "@/core/mutations/createUniqueExpressionLanguage";
import { publishSharedPerspective } from "@/core/mutations/publishSharedPerspective";
import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { getLanguage } from "@/core/queries/getLanguage";
import TextFieldFull from "../../ui/textfields/TextFieldFull.vue";
import CreateButton from "../../ui/buttons/CreateButton.vue";
import Spacer from "../../ui/spacer/Spacer.vue";
import { getPerspective } from "@/core/queries/getPerspective";

export default defineComponent({
  props: ["showCreateCommunity"],
  setup() {
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
      let typedExpLangs = [
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

      const profile: Profile = this.$store.getters.getProfile;

      let createProfileExpression = await createProfile(
        profileExpressionLang.address!,
        profile.username,
        profile.email,
        profile.givenName,
        profile.familyName,
        profile.profilePicture,
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
        expressionLangs,
        MembraneType.Inherited,
        typedExpLangs
      );

      //Get the created community perspective so we can get the SharedPerspectiveURL
      let communityPerspective = await getPerspective(
        createSourcePerspective.uuid!
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
          typedExpressionLanguages: typedExpLangs,
          groupExpressionRef: createExp,
          sharedPerspectiveUrl: communityPerspective.sharedURL!,
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
  },
  components: {
    TextFieldFull,
    Spacer,
    CreateButton,
  },
});
</script>

<style></style>
