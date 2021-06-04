import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Commit } from "vuex";
import { createChannel } from "@/core/methods/createChannel";
import { createProfile } from "@/core/methods/createProfile";
import { createExpression } from "@/core/mutations/createExpression";
import { createUniqueExpressionLanguage } from "@/core/mutations/createUniqueExpressionLanguage";
import { publishSharedPerspective } from "@/core/mutations/publishSharedPerspective";
import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { getLanguage } from "@/core/queries/getLanguage";
import { getPerspective } from "@/core/queries/getPerspective";
import sleep from "@/utils/sleep";

import {
  ExpressionUIIcons,
  MembraneType,
  Profile,
  JuntoExpressionReference,
  ExpressionTypes,
} from "@/store";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  perspectiveName: string;
  description: string;
}

export default async (
  { commit, getters }: Context,
  { perspectiveName, description }: Payload
): Promise<void> => {
  try {
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

    //await sleep(10000);

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
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
