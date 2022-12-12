import { Profile } from "utils/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} from "utils/constants/profile";
import {
  resizeImage,
  dataURItoBlob,
  blobToDataURL,
} from "utils/helpers/profileHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { createLinks, createLiteralLinks } from "utils/helpers/linkHelpers";
import { cacheImage } from "utils/helpers/cacheImage";

export interface Payload {
  username?: string;
  profilePicture?: string;
  bio?: string;
  profileBackground?: string;
}

export default async (payload: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const client = await getAd4mClient();

    const currentProfile = userStore.getProfile;
    const newProfile = {
      ...currentProfile,
      ...payload,
    } as Profile;

    const { perspective } = await client.agent.me();

    if (!perspective) {
      const error = "No user perspective found";
      appStore.showDangerToast({
        message: error,
      });
      throw new Error(error);
    }

    let profilePictureUrl = "";
    let profileThumbnailUrl = "";
    let profileBackgroundUrl = "";

    if (payload.profileBackground) {
      profileBackgroundUrl = await client.expression.create(
        payload.profileBackground,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
      cacheImage(profileBackgroundUrl, payload.profileBackground);
    }

    if (payload.profilePicture) {
      profilePictureUrl = await client.expression.create(
        payload.profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
      cacheImage(profilePictureUrl, payload.profilePicture);
    }

    if (payload.profilePicture) {
      const resizedImage = await resizeImage(
        dataURItoBlob(payload.profilePicture as string),
        100
      );
      const thumbnail = await blobToDataURL(resizedImage!);

      profileThumbnailUrl = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
      cacheImage(profileThumbnailUrl, thumbnail);
    }

    const removals = perspective.links.filter(
      (l) => l.data.source === FLUX_PROFILE
    );

    const links = await createLiteralLinks(FLUX_PROFILE, {
      ...(payload.bio !== undefined && { [HAS_BIO]: payload.bio }),
      ...(payload.username !== undefined && {
        [HAS_USERNAME]: payload.username,
      }),
    });

    const imageLinks = await createLinks(FLUX_PROFILE, {
      ...(profileBackgroundUrl && {
        [HAS_BG_IMAGE]: profileBackgroundUrl,
      }),
      ...(profilePictureUrl && {
        [HAS_PROFILE_IMAGE]: profilePictureUrl,
      }),
      ...(profileThumbnailUrl && {
        [HAS_THUMBNAIL_IMAGE]: profileThumbnailUrl,
      }),
    });

    const newLinks = [...links, ...imageLinks];

    await client.agent.mutatePublicPerspective({
      additions: newLinks,
      removals: removals,
    });

    userStore.setUserProfile({
      ...newProfile,
      profileThumbnailPicture: profileThumbnailUrl,
      profileBackground: profileBackgroundUrl,
      profilePicture: profilePictureUrl,
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
