import { ProfileExpression, ProfileWithDID } from "@/store/types";
import { Profile } from "@/store/types";
import {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} from "@/constants/profile";
import { IMAGE, CONTENT_SIZE, CONTENT_URL, THUMBNAIL } from "@/constants/image";
import { ad4mClient } from "@/app";
import getAgentLinks from "./getAgentLinks";

interface Image {
  contentUrl: string;
  contentSize: string;
}

interface ImageWithThumbnail extends Image {
  thumbnail?: Image;
}

function shouldParse(data: any) {
  return data && typeof data === "string";
}

export function parseThumbnail(data: any): Image {
  const thumbnail = shouldParse(data) ? JSON.parse(data) : data;
  return {
    contentUrl: thumbnail[CONTENT_URL],
    contentSize: thumbnail[CONTENT_SIZE],
  };
}

export function parseImage(data: string): ImageWithThumbnail {
  const image = shouldParse(data) ? JSON.parse(data) : data;
  return {
    contentUrl: image[CONTENT_URL],
    contentSize: image[CONTENT_SIZE],
    thumbnail: image[THUMBNAIL] && parseThumbnail(image[THUMBNAIL]),
  };
}

export async function getProfile(did: string): Promise<ProfileWithDID | null> {
  const links = await getAgentLinks(did);

  const profile: Profile = {
    username: "",
    bio: "",
    email: "",
    givenName: "",
    familyName: "",
  };

  for (const link of links.filter((e) => e.data.source === FLUX_PROFILE)) {
    let expUrl;
    let image;

    switch (link.data.predicate) {
      case HAS_USERNAME:
        profile!.username = link.data.target;
        break;
      case HAS_BIO:
        profile!.bio = link.data.target;
        break;
      case HAS_GIVEN_NAME:
        profile!.givenName = link.data.target;
        break;
      case HAS_FAMILY_NAME:
        profile!.familyName = link.data.target;
        break;
      case HAS_PROFILE_IMAGE:
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          profile!.profilePicture = image.data.slice(1, -1);
        }
        break;
      case HAS_THUMBNAIL_IMAGE:
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === FLUX_PROFILE) {
            profile!.thumbnailPicture = image.data.slice(1, -1);
          }
        }
        break;
      case HAS_BG_IMAGE:
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === FLUX_PROFILE) {
            profile!.profileBg = image.data.slice(1, -1);
          }
        }
        break;
      case HAS_EMAIL:
        profile!.email = link.data.target;
        break;
      default:
        break;
    }
  }

  return { ...profile, did };
}
