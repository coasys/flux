import { AD4M_AGENT, KAICHAO_AGENT, JUNTO_AGENT } from "utils/constants/agents";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import {
  FLUX_PROFILE,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} from "utils/constants/profile";

import { useAppStore } from "@/store/app";
import {
  resizeImage,
  dataURItoBlob,
  blobToDataURL,
} from "utils/helpers/profileHelpers";
import { Link, LinkExpression, LinkMutations } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { useUserStore } from "..";

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  email: string;
  profilePicture?: string;
  profileThumbnailPicture?: string;
}

export default async ({
  givenName = "",
  familyName = "",
  email = "",
  username,
  profilePicture,
}: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();
  const client = await getAd4mClient();

  try {
    //Install the noteipfs language
    await client.runtime.addTrustedAgents([
      AD4M_AGENT,
      KAICHAO_AGENT,
      JUNTO_AGENT,
    ]);
    await client.languages.byAddress(NOTE_IPFS_EXPRESSION_OFFICIAL);

    const resizedImage = profilePicture
      ? await resizeImage(dataURItoBlob(profilePicture as string), 100)
      : undefined;

    const thumbnail = profilePicture
      ? await blobToDataURL(resizedImage!)
      : undefined;

    const additions = [] as Link[];
    const removals = [] as LinkExpression[];

    let profileImage = null;
    let thumbnailImage = null;

    if (profilePicture) {
      thumbnailImage = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      profileImage = await client.expression.create(
        profilePicture,
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

    const mutateResult = await client.agent.mutatePublicPerspective({
      additions,
      removals,
    } as LinkMutations);

    userStore.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture: profileImage || undefined,
      profileThumbnailPicture: thumbnailImage || undefined,
      bio: "",
    });

    const status = await client.agent.status();

    userStore.updateAgentStatus(status);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
