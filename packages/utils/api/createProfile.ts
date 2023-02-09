import { AD4M_AGENT, KAICHAO_AGENT, JUNTO_AGENT } from "../constants";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../constants";
import {
  FLUX_PROFILE,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} from "../constants";

import {
  resizeImage,
  dataURItoBlob,
  blobToDataURL,
} from "../helpers";
import {
  Ad4mClient,
  Link,
  LinkExpression,
  LinkMutations,
} from "@perspect3vism/ad4m";

import { Profile } from "../types";

import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

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
    ]);
    await client.languages.byAddress(NOTE_IPFS_EXPRESSION_OFFICIAL);

    const additions = [] as Link[];
    const removals = [] as LinkExpression[];

    let profileImage: null | string = null;
    let thumbnailImage: null | string = null;

    if (profilePicture) {
      const compressedProfileImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(profilePicture as string), 0.6)
      );

      profileImage = await client.expression.create(
        compressedProfileImage,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const compressedpThumbnailImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(profilePicture as string), 0.3)
      );

      thumbnailImage = await client.expression.create(
        compressedpThumbnailImage,
        NOTE_IPFS_EXPRESSION_OFFICIAL
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
