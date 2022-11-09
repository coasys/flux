import { v4 as uuidv4 } from "uuid";
import {
  PERSPECTIVE_DIFF_SYNC,
  NOTE_IPFS_EXPRESSION_OFFICIAL,
} from "../constants/languages";
import {
  MEMBER,
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_THUMBNAIL,
  ZOME,
} from "../constants/communityPredicates";
import { createNeighbourhoodMeta } from "../helpers/createNeighbourhoodMeta";
import { Community } from "../types";
import { Perspective, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "utils/helpers/profileHelpers";

export interface Payload {
  name: string;
  image?: string;
  thumbnail?: string;
  description?: string;
  perspectiveUuid?: string;
}

export default async function createCommunity({
  name,
  description = "",
  thumbnail = "",
  image = "",
  perspectiveUuid,
}: Payload): Promise<Community> {
  try {
    const client = await getAd4mClient();
    const agent = await client.agent.me();

    const author = agent.did;

    const perspective = perspectiveUuid
      ? await client.perspective.byUUID(perspectiveUuid)
      : await client.perspective.add(name);

    const uid = uuidv4().toString();

    //Create unique social-context
    const linkLanguage = await client.languages.applyTemplateAndPublish(
      PERSPECTIVE_DIFF_SYNC,
      JSON.stringify({
        uid: uid,
        name: `${name}-link-language`,
      })
    );

    //Publish perspective
    const metaLinks = await createNeighbourhoodMeta(
      name,
      description,
      author
    );

    const meta = new Perspective(metaLinks);
    let sharedUrl = perspective!.sharedUrl;

    if (!sharedUrl) {
      const neighbourhood = await client.neighbourhood.publishFromPerspective(
        perspective!.uuid,
        linkLanguage.address,
        meta
      );

      sharedUrl = neighbourhood;

      console.log("Created neighbourhood with result", neighbourhood);
    }

    let tempImage = image;
    let tempThumbnail = thumbnail;

    if (image) {
      const resizedImage = await resizeImage(
        dataURItoBlob(image as string),
        100
      );

      const thumbnail = await blobToDataURL(resizedImage);

      tempImage = await client.expression.create(
        image,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      tempThumbnail = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      await client.perspective.addLink(perspective!.uuid, {
        source: SELF,
        target: tempImage,
        predicate: FLUX_GROUP_IMAGE,
      });

      await client.perspective.addLink(perspective!.uuid, {
        source: SELF,
        target: tempThumbnail,
        predicate: FLUX_GROUP_THUMBNAIL,
      });
    }

    //Create link between perspective and group expression
    const groupNameExpr = await client.expression.create(name, "literal");

    await client.perspective.addLink(perspective!.uuid, {
      source: SELF,
      target: groupNameExpr,
      predicate: FLUX_GROUP_NAME,
    });

    if (description) {
      const descriptionExpr = await client.expression.create(
        description,
        "literal"
      );
      await client.perspective.addLink(perspective!.uuid, {
        source: SELF,
        target: descriptionExpr,
        predicate: FLUX_GROUP_DESCRIPTION,
      });
    }

    //Create link between perspective and group expression
    const addProfileLink = await client.perspective.addLink(perspective!.uuid, {
      source: SELF,
      target: `did://${author}`,
      predicate: MEMBER,
    });
    console.log("Created profile expression link", addProfileLink);

    //Default popular setting is 3 upvotes on thumbsup emoji
    const sdnaLiteral = Literal.from(`emojiCount(Message, Count):- 
      aggregate_all(count, link(Message, "flux://has_reaction", "emoji://1f44d", _, _), Count).

      isPopular(Message) :- emojiCount(Message, Count), Count >= 3.
      isNotPopular(Message) :- emojiCount(Message, Count), Count < 3.

      flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages):-
      link(Channel, "temp://directly_succeeded_by", Message, Timestamp, Author),
      findall((EditMessage, EditMessageTimestamp, EditMessageAuthor), link(Message, "temp://edited_to", EditMessage, EditMessageTimestamp, EditMessageAuthor), EditMessages),
      findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "flux://has_reaction", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
      findall((IsHidden, IsHiddenTimestamp, IsHiddenAuthor), link(Message, "flux://is_card_hidden", IsHidden, IsHiddenTimestamp, IsHiddenAuthor), AllCardHidden),
      findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "flux://has_reply", Message, ReplyTimestamp, ReplyAuthor), Replies).
      
      flux_message_query_popular(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, true):- 
      flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isPopular(Message).
      
      flux_message_query_popular(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, false):- 
      flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isNotPopular(Message).`);

    // await ad4mClient.perspective.addLink(perspectiveUuid, {source: "self", predicate: "ad4m://has_zome", target: sdnaLiteral.toUrl()});
    const addSocialDnaLink = await client.perspective.addLink(
      perspective!.uuid,
      {
        source: SELF,
        predicate: ZOME,
        target: sdnaLiteral.toUrl(),
      }
    );
    console.log("Created social dna link", addSocialDnaLink);

    // @ts-ignore
    return {
      uuid: perspective!.uuid,
      author: author,
      timestamp: addSocialDnaLink.timestamp,
      name: name,
      description: description || "",
      image: tempImage,
      thumbnail: tempThumbnail,
      neighbourhoodUrl: sharedUrl,
      members: [author],
    };
  } catch (e) {
    throw new Error(e);
  }
}
