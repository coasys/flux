import { v4 as uuidv4 } from "uuid";
import {
  PERSPECTIVE_DIFF_SYNC,
  NOTE_IPFS_EXPRESSION_OFFICIAL,
} from "utils/constants/languages";

import {
  MEMBER,
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_THUMBNAIL,
  ZOME,
} from "utils/constants/neighbourhoodMeta";

import { CommunityState } from "@/store/types";
import { Perspective, PerspectiveHandle, Literal } from "@perspect3vism/ad4m";
import { createNeighbourhoodMeta } from "@/core/methods/createNeighbourhoodMeta";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "utils/helpers/profileHelpers";

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
  perspective,
}: Payload): Promise<CommunityState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const client = await getAd4mClient();
    const agent = await client.agent.me();

    const creatorDid = agent.did;

    const createSourcePerspective =
      perspective ||
      ((await client.perspective.add(perspectiveName)) as PerspectiveHandle);
    console.log("Created source perspective", createSourcePerspective);

    //Get the variables that we need to create new unique languages
    const uid = uuidv4().toString();

    //Create unique social-context
    const socialContextLang = await client.languages.applyTemplateAndPublish(
      PERSPECTIVE_DIFF_SYNC,
      JSON.stringify({
        uid: uid,
        name: `${perspectiveName}-link-language`,
      })
    );
    console.log("Response from create social-context", socialContextLang);

    //Publish perspective
    const metaLinks = await createNeighbourhoodMeta(
      perspectiveName,
      description,
      creatorDid
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

      const thumbnail = image ? await blobToDataURL(resizedImage!) : undefined;

      tempImage = await client.expression.create(
        image,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      tempThumbnail = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      await client.perspective.addLink(createSourcePerspective.uuid!, {
        source: SELF,
        target: tempImage,
        predicate: FLUX_GROUP_IMAGE,
      });
      await client.perspective.addLink(createSourcePerspective.uuid!, {
        source: SELF,
        target: tempThumbnail,
        predicate: FLUX_GROUP_THUMBNAIL,
      });
    }

    //Create link between perspective and group expression
    const groupNameExpr = await client.expression.create(
      perspectiveName,
      "literal"
    );
    await client.perspective.addLink(createSourcePerspective.uuid!, {
      source: SELF,
      target: groupNameExpr,
      predicate: FLUX_GROUP_NAME,
    });

    if (description) {
      const descriptionExpr = await client.expression.create(
        description,
        "literal"
      );
      await client.perspective.addLink(createSourcePerspective.uuid!, {
        source: SELF,
        target: descriptionExpr,
        predicate: FLUX_GROUP_DESCRIPTION,
      });
    }

    //Create link between perspective and group expression
    const addProfileLink = await client.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: SELF,
        target: `did://${creatorDid}`,
        predicate: MEMBER,
      }
    );
    console.log("Created profile expression link", addProfileLink);


    let sdnaLiteral = Literal.from(`flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden):-
    link(Channel, "temp://directly_succeeded_by", Message, Timestamp, Author),
    findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "flux://has_reaction", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
    findall((IsHidden, IsHiddenTimestamp, IsHiddenAuthor), link(Message, "flux://is_card_hidden", IsHidden, IsHiddenTimestamp, IsHiddenAuthor), AllCardHidden),
    findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "flux://has_reply", Message, ReplyTimestamp, ReplyAuthor), Replies).`)

    // await ad4mClient.perspective.addLink(perspectiveUuid, {source: "self", predicate: "ad4m://has_zome", target: sdnaLiteral.toUrl()});
    const addSocialDnaLink = await client.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: SELF,
        predicate: ZOME,
        target: sdnaLiteral.toUrl(),
      }
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
        neighbourhoodUrl: sharedUrl,
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
      communityId: createSourcePerspective.uuid,
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
