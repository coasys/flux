import { v4 as uuidv4 } from "uuid";
import { createProfile } from "@/core/methods/createProfile";
import { createExpression } from "@/core/mutations/createExpression";
import { templateLanguage } from "@/core/mutations/templateLanguage";
import { createNeighbourhood } from "@/core/mutations/createNeighbourhood";
import { addPerspective } from "@/core/mutations/addPerspective";
import { createLink } from "@/core/mutations/createLink";
import {
  SOCIAL_CONTEXT_OFFICIAL,
  GROUP_EXPRESSION_OFFICIAL,
  PROFILE_EXPRESSION_OFFICIAL,
  SHORTFORM_EXPRESSION_OFFICIAL,
} from "@/constants/languages";

import { MEMBER } from "@/constants/neighbourhoodMeta";

import {
  MembraneType,
  FluxExpressionReference,
  ExpressionTypes,
  CommunityState,
  FeedType,
} from "@/store/types";
import { Perspective } from "@perspect3vism/ad4m";
import { createNeighbourhoodMeta } from "@/core/methods/createNeighbourhoodMeta";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

export interface Payload {
  perspectiveName: string;
  image?: string;
  thumbnail?: string;
  description: string;
}

export default async ({
  perspectiveName,
  description,
  thumbnail = "",
  image = "",
}: Payload): Promise<CommunityState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const creatorDid = userStore.getUser?.agent.did || "";

    const createSourcePerspective = await addPerspective(perspectiveName);
    console.log("Created source perspective", createSourcePerspective);

    //Get the variables that we need to create new unique languages
    const uid = uuidv4().toString();

    //Create unique social-context
    const socialContextLang = await templateLanguage(
      SOCIAL_CONTEXT_OFFICIAL,
      JSON.stringify({
        uid: uid,
        name: `${perspectiveName}-social-context`,
      })
    );
    console.log("Response from create social-context", socialContextLang);
    //Create shortform expression language
    const shortFormExpressionLang = await templateLanguage(
      SHORTFORM_EXPRESSION_OFFICIAL,
      JSON.stringify({
        uid: uid,
        name: `${perspectiveName}-shortform-expression`,
      })
    );
    console.log(
      "Response from create shortform exp lang",
      shortFormExpressionLang
    );
    //Create group expression language
    const groupExpressionLang = await templateLanguage(
      GROUP_EXPRESSION_OFFICIAL,
      JSON.stringify({
        uid: uid,
        name: `${perspectiveName}-group-expression`,
      })
    );
    console.log("Response from create group exp lang", groupExpressionLang);
    //Create profile expression language
    const profileExpressionLang = await templateLanguage(
      PROFILE_EXPRESSION_OFFICIAL,
      JSON.stringify({
        uid: uid,
        name: `${perspectiveName}-profile-expression`,
      })
    );
    console.log("Response from create profile exp lang", profileExpressionLang);
    const typedExpLangs = [
      {
        languageAddress: shortFormExpressionLang.address!,
        expressionType: ExpressionTypes.ShortForm,
      } as FluxExpressionReference,
      {
        languageAddress: groupExpressionLang.address!,
        expressionType: ExpressionTypes.GroupExpression,
      } as FluxExpressionReference,
      {
        languageAddress: profileExpressionLang.address!,
        expressionType: ExpressionTypes.ProfileExpression,
      } as FluxExpressionReference,
    ];

    //Publish perspective
    const metaLinks = await createNeighbourhoodMeta(
      perspectiveName,
      description,
      creatorDid,
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
        image: image,
        thumbnail: thumbnail,
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
      userStore.getProfile
    );

    const createProfileExpression = await createProfile(
      profileExpressionLang.address!,
      userStore.getProfile!
    );

    //Create link between perspective and group expression
    const addProfileLink = await createLink(createSourcePerspective.uuid!, {
      source: `${neighbourhood}://self`,
      target: createProfileExpression,
      predicate: MEMBER,
    });
    console.log("Created profile expression link", addProfileLink);

    const newCommunity = {
      neighbourhood: {
        name: perspectiveName,
        creatorDid: creatorDid,
        description: description,
        image: image,
        thumbnail: thumbnail,
        perspective: createSourcePerspective,
        typedExpressionLanguages: typedExpLangs,
        groupExpressionRef: createExp,
        neighbourhoodUrl: neighbourhood,
        membraneType: MembraneType.Unique,
        linkedPerspectives: [createSourcePerspective.uuid],
        linkedNeighbourhoods: [createSourcePerspective.uuid],
        members: [],
        membraneRoot: createSourcePerspective.uuid,
        currentExpressionLinks: {},
        currentExpressionMessages: {},
        createdAt: new Date().toISOString(),
      },
      state: {
        perspectiveUuid: createSourcePerspective.uuid,
        theme: {
          fontSize: "md",
          fontFamily: "Poppins",
          name: "light",
          hue: 270,
          saturation: 60,
        },
        useLocalTheme: false,
        currentChannelId: null,
      },
    } as CommunityState;

    dataStore.addCommunity(newCommunity);
    // We add a default channel that is a reference to
    // the community itself. This way we can utilize the fractal nature of
    // neighbourhoods. Remember that this also need to happen in join community.
    dataStore.addLocalChannel({
      perspectiveUuid: createSourcePerspective.uuid,
      channel: {
        perspectiveUuid: createSourcePerspective.uuid,
        hasNewMessages: false,
        feedType: FeedType.Signaled,
        notifications: {
          mute: false,
        },
      },
    });

    // @ts-ignore
    return newCommunity;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
