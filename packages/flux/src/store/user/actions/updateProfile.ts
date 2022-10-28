import { Profile } from "utils/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { useDataStore } from "@/store/data";
import { Link, LinkExpression, PerspectiveInput } from "@perspect3vism/ad4m";
import removeTypeName from "utils/helpers/removeTypeName";
import getAgentLinks from "utils/api/getAgentLinks";
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
import { createLiteralLinks } from "utils/helpers/linkHelpers";

export interface Payload {
  username?: string;
  profilePicture?: string;
  bio?: string;
  profileBg?: string;
}

export default async (payload: Payload): Promise<void> => {
  const dataStore = useDataStore();
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

    let profileUrl = "";
    let thumbnailUrl = "";
    let bgUrl = "";

    if (payload.profileBg) {
      profileUrl = await client.expression.create(
        payload.profileBg,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
    }

    if (payload.profilePicture) {
      profileUrl = await client.expression.create(
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

      thumbnailUrl = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
    }

    const removals = perspective.links.filter(
      (l) => l.data.source === FLUX_PROFILE
    );

    const links = await createLiteralLinks(FLUX_PROFILE, {
      [HAS_BIO]: payload.bio,
      [HAS_USERNAME]: payload.username,
      [HAS_BG_IMAGE]: bgUrl,
      [HAS_PROFILE_IMAGE]: profileUrl,
      [HAS_THUMBNAIL_IMAGE]: thumbnailUrl,
    });

    await client.agent.mutatePublicPerspective({
      additions: links,
      removals: removals,
    });

    userStore.setUserProfile({
      ...newProfile,
      thumbnailPicture: thumbnailUrl,
      profileBg: bgUrl,
      profilePicture: profileUrl,
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
