import { agents, languages, profile } from "@fluxapp/constants";
import { resizeImage, dataURItoBlob, blobToDataURL } from "@fluxapp/utils";
import {
  Ad4mClient,
  Link,
  LinkExpression,
  LinkMutations,
} from "@perspect3vism/ad4m";
import { Profile } from "@fluxapp/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const { AD4M_AGENT, KAICHAO_AGENT, JUNTO_AGENT, NOTE_IPFS_AUTHOR } = agents;
const { FILE_STORAGE_LANGUAGE } = languages;
const {
  FLUX_PROFILE,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profile;

export interface Payload {
  givenName?: string;
  familyName?: string;
  username: string;
  email?: string;
  profileBackground?: string;
  profilePicture?: string;
  profileThumbnailPicture?: string;
}

export default async ({
  givenName = "",
  familyName = "",
  email = "",
  username,
  profileThumbnailPicture,
  profileBackground,
  profilePicture,
}: Payload): Promise<Profile> => {
  const client: Ad4mClient = await getAd4mClient();

  try {
    //Install the noteipfs language
    await client.runtime.addTrustedAgents([
      AD4M_AGENT,
      KAICHAO_AGENT,
      JUNTO_AGENT,
      NOTE_IPFS_AUTHOR,
    ]);
    await client.languages.byAddress(FILE_STORAGE_LANGUAGE);

    const additions = [] as Link[];
    const removals = [] as LinkExpression[];

    let profileImage: null | string = null;
    let thumbnailImage: null | string = null;

    if (profilePicture) {
      const compressedProfileImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(profilePicture as string), 0.6)
      );

      profileImage = await client.expression.create(
        {
          data_base64: compressedProfileImage,
          name: "profile-image",
          file_type: "image/png",
        },
        FILE_STORAGE_LANGUAGE
      );

      const compressedpThumbnailImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(profilePicture as string), 0.3)
      );

      thumbnailImage = await client.expression.create(
        {
          data_base64: compressedpThumbnailImage,
          name: "thumbnail-image",
          file_type: "image/png",
        },
        FILE_STORAGE_LANGUAGE
      );

      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: profileImage,
          predicate: HAS_PROFILE_IMAGE,
        })
      );

      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: thumbnailImage,
          predicate: HAS_THUMBNAIL_IMAGE,
        })
      );
    }

    if (givenName) {
      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: givenName,
          predicate: HAS_GIVEN_NAME,
        })
      );
    }

    if (familyName) {
      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: familyName,
          predicate: HAS_FAMILY_NAME,
        })
      );
    }

    if (email) {
      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: email,
          predicate: HAS_EMAIL,
        })
      );
    }

    if (username) {
      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: username,
          predicate: HAS_USERNAME,
        })
      );
    }

    const agent = await client.agent.me();

    await client.agent.mutatePublicPerspective({
      additions,
      removals,
    } as LinkMutations);

    return {
      did: agent.did,
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profileBackground: "",
      profilePicture: profileImage || "",
      profileThumbnailPicture: thumbnailImage || "",
      bio: "",
    };
  } catch (e) {
    throw new Error(e);
  }
};
