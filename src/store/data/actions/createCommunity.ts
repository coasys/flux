import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createChannel } from "@/core/methods/createChannel";
import { createProfile } from "@/core/methods/createProfile";
import { createExpression } from "@/core/mutations/createExpression";
import { createUniqueHolochainLanguage } from "@/core/mutations/createUniqueHolochainLanguage";
import { createNeighbourhood } from "@/core/mutations/createNeighbourhood";
import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import { getLanguage } from "@/core/queries/getLanguage";
import sleep from "@/utils/sleep";

import {
  ExpressionUIIcons,
  MembraneType,
  JuntoExpressionReference,
  ExpressionTypes,
  CommunityState,
} from "@/store/types";
import { dataActionContext } from "@/store/data/index";
import { appActionContext } from "@/store/app/index";
import { userActionContext } from "@/store/user/index";
import { Perspective } from "@perspect3vism/ad4m";
import { createNeighbourhoodMeta } from "@/core/methods/createNeighbourhoodMeta";

export interface Payload {
  perspectiveName: string;
  description: string;
}

export default async (
  context: any,
  { perspectiveName, description }: Payload
): Promise<CommunityState> => {
  const { commit: dataCommit } = dataActionContext(context);
  const { commit: appCommit, getters: appGetters } = appActionContext(context);
  const { state: userState, getters: userGetters } = userActionContext(context);

  try {
    const createSourcePerspective = await addPerspective(perspectiveName);
    console.log("Created source perspective", createSourcePerspective);

    //Get the variables that we need to create new unique languages
    const uid = uuidv4().toString();
    const builtInLangPath = appGetters.getLanguagePath;

    //Create unique social-context
    const socialContextLang = await createUniqueHolochainLanguage(
      path.join(builtInLangPath, "social-context"),
      "social-context",
      uid
    );
    console.log("Response from create social-context", socialContextLang);
    //Create shortform expression language
    const shortFormExpressionLang = await createUniqueHolochainLanguage(
      path.join(builtInLangPath, "shortform-expression"),
      "shortform-expression",
      uid
    );
    console.log(
      "Response from create shortform exp lang",
      shortFormExpressionLang
    );
    //Create group expression language
    const groupExpressionLang = await createUniqueHolochainLanguage(
      path.join(builtInLangPath, "group-expression"),
      "group-expression",
      uid
    );
    console.log("Response from create group exp lang", groupExpressionLang);
    //Create profile expression language
    const profileExpressionLang = await createUniqueHolochainLanguage(
      path.join(builtInLangPath, "profiles"),
      "agent-profiles",
      uid
    );
    console.log("Response from create profile exp lang", profileExpressionLang);
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
    const metaLinks = await createNeighbourhoodMeta(
      perspectiveName,
      description,
      typedExpLangs
    );
    const meta = new Perspective(metaLinks);
    const neighbourhood = await createNeighbourhood(
      createSourcePerspective.uuid,
      socialContextLang.address,
      meta
    );
    console.log("Created neighbourhood with result", neighbourhood);
    createSourcePerspective.sharedUrl = neighbourhood;

    //await sleep(10000);

    //Create link denoting type of community
    const addLink = await createLink(createSourcePerspective.uuid!, {
      source: `${neighbourhood}://self`,
      target: "sioc://community",
      predicate: "rdf://type",
    });
    console.log("Added typelink with response", addLink);

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
      source: `${neighbourhood}://self`,
      target: createExp,
      predicate: "rdf://class",
    });
    console.log(
      "Created group expression link",
      addGroupExpLink,
      userState,
      userGetters.getProfile
    );

    const createProfileExpression = await createProfile(
      profileExpressionLang.address!,
      userGetters.getProfile!
    );

    //Create link between perspective and group expression
    const addProfileLink = await createLink(createSourcePerspective.uuid!, {
      source: `${neighbourhood}://self`,
      target: createProfileExpression,
      predicate: "sioc://has_member",
    });
    console.log("Created profile expression link", addProfileLink);

    //Next steps: create another perspective + share with social-context-channel link language and add above expression DNA's onto it
    //Then create link from source social context pointing to newly created SharedPerspective w/appropriate predicate to denote its a dm channel
    const channel = await createChannel(
      "Home",
      builtInLangPath,
      createSourcePerspective,
      MembraneType.Inherited,
      typedExpLangs
    );
    console.log("created channel with result", channel);

    const newCommunity = {
      neighbourhood: {
        name: perspectiveName,
        description: description,
        perspective: createSourcePerspective,
        typedExpressionLanguages: typedExpLangs,
        groupExpressionRef: createExp,
        neighbourhoodUrl: neighbourhood,
        membraneType: MembraneType.Unique,
        linkedPerspectives: [channel.neighbourhood.perspective.uuid],
        linkedNeighbourhoods: [channel.neighbourhood.neighbourhoodUrl],
        members: [],
        currentExpressionLinks: {},
        currentExpressionMessages: {},
        createdAt: new Date(),
      },
      state: {
        perspectiveUuid: createSourcePerspective.uuid,
        theme: {
          fontSize: "md",
          fontFamily: "default",
          name: "light",
          hue: 270,
          saturation: 60,
        },
        useGlobalTheme: false,
        currentChannelId: channel.neighbourhood.perspective.uuid,
      },
    } as CommunityState;
    dataCommit.addCommunity(newCommunity);
    dataCommit.createChannel(channel);

    //Get and cache the expression UI for each expression language
    for (const lang of typedExpLangs) {
      console.log("CreateCommunity.vue: Fetching UI lang:", lang);
      const languageRes = await getLanguage(lang.languageAddress);
      const uiData: ExpressionUIIcons = {
        languageAddress: lang.languageAddress,
        createIcon: languageRes!.constructorIcon?.code || "",
        viewIcon: languageRes!.icon?.code || "",
        name: languageRes!.name!,
      };
      appCommit.addExpressionUI(uiData);
      await sleep(40);
    }

    // @ts-ignore
    return newCommunity;
  } catch (e) {
    appCommit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
