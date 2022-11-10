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
    // TODO: add profilebg here.
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
    }

    if (payload.profilePicture) {
      profilePictureUrl = await client.expression.create(
        payload.profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
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
    }

    const removals = perspective.links.filter(
      (l) => l.data.source === FLUX_PROFILE
    );

    const links = await createLiteralLinks(FLUX_PROFILE, {
      [HAS_BIO]: payload.bio,
      [HAS_USERNAME]: payload.username
    });

    const imageLinks = await createLinks(FLUX_PROFILE, {
      [HAS_BG_IMAGE]: profileBackgroundUrl,
      [HAS_PROFILE_IMAGE]: profilePictureUrl,
      [HAS_THUMBNAIL_IMAGE]: profileThumbnailUrl,
    })

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
