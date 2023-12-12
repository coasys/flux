import { Profile } from "@coasys/flux-types";
import { languages, profile } from "@coasys/flux-constants";
import {
  resizeImage,
  dataURItoBlob,
  blobToDataURL,
  createLinks,
  createLiteralLinks,
} from "@coasys/flux-utils";

import getProfile from "./getProfile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { LinkExpression } from "@perspect3vism/ad4m";

const { FILE_STORAGE_LANGUAGE } = languages;
const {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profile;

export interface Payload {
  username?: string;
  profilePicture?: string;
  bio?: string;
  profileBackground?: string;
}

export default async function updateProfile(
  payload: Payload
): Promise<Profile> {
  try {
    const client = await getAd4mClient();

    const me = await client.agent.me();

    const oldProfile = await getProfile(me.did);

    const newProfile = {
      ...oldProfile,
      ...payload,
    } as Profile;

    const { perspective } = await client.agent.me();

    if (!perspective) {
      const error = "No user perspective found";
      throw new Error(error);
    }

    let profilePictureUrl = "";
    let profileThumbnailUrl = "";
    let profileBackgroundUrl = "";

    if (payload.profileBackground) {
      const compressedImage = await blobToDataURL(
        await resizeImage(
          dataURItoBlob(payload.profileBackground as string),
          0.6
        )
      );

      profileBackgroundUrl = await client.expression.create(
        {
          data_base64: compressedImage,
          name: "profile-background",
          file_type: "image/png",
        },
        FILE_STORAGE_LANGUAGE
      );
    }

    if (payload.profilePicture) {
      const compressedImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(payload.profilePicture as string), 0.6)
      );

      profilePictureUrl = await client.expression.create(
        {
          data_base64: compressedImage,
          name: "profile-picture",
          file_type: "image/png",
        },
        FILE_STORAGE_LANGUAGE
      );
    }

    if (payload.profilePicture) {
      const compressedImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(payload.profilePicture as string), 0.3)
      );

      profileThumbnailUrl = await client.expression.create(
        {
          data_base64: compressedImage,
          name: "profile-thumbnail",
          file_type: "image/png",
        },
        FILE_STORAGE_LANGUAGE
      );
    }

    const removals = perspective.links.filter(
      (l: LinkExpression) => l.data.source === FLUX_PROFILE
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

    return {
      ...newProfile,
      profileThumbnailPicture: profileThumbnailUrl,
      profileBackground: profileBackgroundUrl,
      profilePicture: profilePictureUrl,
    };
  } catch (e) {
    throw new Error(e);
  }
}
