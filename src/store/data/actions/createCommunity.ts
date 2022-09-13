import { v4 as uuidv4 } from "uuid";
import {
  SOCIAL_CONTEXT_OFFICIAL,
  GROUP_EXPRESSION_OFFICIAL,
  NOTE_IPFS_EXPRESSION_OFFICIAL
} from "@/constants/languages";

import { MEMBER, SELF, FLUX_GROUP_NAME, FLUX_GROUP_IMAGE, FLUX_GROUP_DESCRIPTION, FLUX_GROUP_THUMBNAIL } from "@/constants/neighbourhoodMeta";

import {
  MembraneType,
  FluxExpressionReference,
  ExpressionTypes,
  CommunityState,
  FeedType,
} from "@/store/types";
import { Perspective, PerspectiveHandle, Literal } from "@perspect3vism/ad4m";
import { createNeighbourhoodMeta } from "@/core/methods/createNeighbourhoodMeta";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { getAd4mClient } from '@perspect3vism/ad4m-connect/dist/web'
import { blobToDataURL, dataURItoBlob, resizeImage } from "@/utils/profileHelpers";

export interface Payload {
  perspectiveName: string;
  image?: string;
  thumbnail?: string;
  description: string;
  perspective?: Perspective;
}

export default async ({
  perspectiveName,
  description,
  thumbnail = "",
  image = "",
  perspective
}: Payload): Promise<CommunityState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const client = await getAd4mClient();
    const agent = await client.agent.me()

    const creatorDid = agent.did;

    const createSourcePerspective = perspective || (await client.perspective.add(
      perspectiveName
    )) as PerspectiveHandle;
    console.log("Created source perspective", createSourcePerspective);

    //Get the variables that we need to create new unique languages
    const uid = uuidv4().toString();

    //Create unique social-context
    const socialContextLang =
      await client.languages.applyTemplateAndPublish(
        SOCIAL_CONTEXT_OFFICIAL,
        JSON.stringify({
          uid: uid,
          name: `${perspectiveName}-social-context`,
        })
      );
    console.log("Response from create social-context", socialContextLang);
    //Create group expression language
    const groupExpressionLang =
      await client.languages.applyTemplateAndPublish(
        GROUP_EXPRESSION_OFFICIAL,
        JSON.stringify({
          uid: uid,
          name: `${perspectiveName}-group-expression`,
        })
      );
    console.log("Response from create group exp lang", groupExpressionLang);
    //Get language after templating to install it
    await client.languages.byAddress(groupExpressionLang.address);
    const typedExpLangs = [
      {
        languageAddress: groupExpressionLang.address!,
        expressionType: ExpressionTypes.GroupExpression,
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
    let sharedUrl = createSourcePerspective.sharedUrl;

    if (!sharedUrl) {
      const neighbourhood = await client.neighbourhood.publishFromPerspective(
        createSourcePerspective.uuid,
        socialContextLang.address,
        meta
      );

      sharedUrl = neighbourhood;

      console.log("Created neighbourhood with result", neighbourhood);
    }

    let tempImage = image;
    let tempThumbnail = thumbnail;

    if (image) {
      const resizedImage = image
        ? await resizeImage(dataURItoBlob(image as string), 100)
        : undefined;
      
      const thumbnail = image
        ? await blobToDataURL(resizedImage!)
        : undefined;

      tempImage = await client.expression.create(
        image,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      tempThumbnail = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const addGroupImageLink = await client.perspective.addLink(
        createSourcePerspective.uuid!,
        {
          source: SELF,
          target: tempImage,
          predicate: FLUX_GROUP_IMAGE,
        }
      );
      const addGroupThumbnailLink = await client.perspective.addLink(
        createSourcePerspective.uuid!,
        {
          source: SELF,
          target: tempThumbnail,
          predicate: FLUX_GROUP_THUMBNAIL,
        }
      );  
    }

    //Create link between perspective and group expression
    const addGroupNameLink = await client.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: SELF,
        target: perspectiveName,
        predicate: FLUX_GROUP_NAME,
      }
    );
    const addGroupDescriptionLink = await client.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: SELF,
        target: description || '-',
        predicate: FLUX_GROUP_DESCRIPTION,
      }
    );
  
    //Create link between perspective and group expression
    const addProfileLink = await client.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: SELF,
        target: creatorDid,
        predicate: MEMBER,
      }
    );
    console.log("Created profile expression link", addProfileLink);


    let sdnaLiteral = Literal.from(`flux_message(Channel, Message, Timestamp, Author, Reactions, Replies):-
    link(Channel, "temp://directly_succeeded_by", Message, Timestamp, Author),
    findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "flux://has_reaction", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
    findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "flux://has_reply", Message, ReplyTimestamp, ReplyAuthor), Replies).`)


    // await ad4mClient.perspective.addLink(perspectiveUuid, {source: "self", predicate: "ad4m://has_zome", target: sdnaLiteral.toUrl()});
    const addSocialDnaLink = await client.perspective.addLink(
      createSourcePerspective.uuid!,
      {source: "ad4m://self", predicate: "ad4m://has_zome", target: sdnaLiteral.toUrl()}
    );
    console.log("Created social dna link", addSocialDnaLink);


    const newCommunity = {
      neighbourhood: {
        name: perspectiveName,
        creatorDid: creatorDid,
        description: description,
        image: tempImage,
        thumbnail: tempThumbnail,
        perspective: {
          uuid: createSourcePerspective?.uuid,
          name: createSourcePerspective?.name,
          sharedUrl,
          neighbourhood: createSourcePerspective.neighbourhood,
        },
        typedExpressionLanguages: typedExpLangs,
        neighbourhoodUrl: sharedUrl,
        membraneType: MembraneType.Unique,
        linkedPerspectives: [createSourcePerspective.uuid],
        linkedNeighbourhoods: [createSourcePerspective.uuid],
        members: [creatorDid],
        membraneRoot: createSourcePerspective.uuid,
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
        hasNewMessages: false,
        collapseChannelList: false,
        currentChannelId: null,
        hideMutedChannels: false,
        notifications: {
          mute: false,
        },
      },
    } as CommunityState;

    dataStore.addCommunity(newCommunity);
    // We add a default channel that is a reference to
    // the community itself. This way we can utilize the fractal nature of
    // neighbourhoods. Remember that this also need to happen in join community.
    await dataStore.createChannel({
      name: "Home",
      communityId: createSourcePerspective.uuid
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
