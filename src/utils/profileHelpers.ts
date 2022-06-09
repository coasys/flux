import { ProfileExpression, ProfileWithDID } from "@/store/types";
import { Profile } from "@/store/types";
import {
  ACCOUNT_NAME,
  EMAIL,
  FAMILY_NAME,
  GIVEN_NAME,
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

export function parseProfile(data: ProfileExpression): Profile {
  const image = data[IMAGE] && parseImage(data[IMAGE]);

  return {
    username: data[ACCOUNT_NAME],
    email: data[EMAIL],
    givenName: data[GIVEN_NAME],
    familyName: data[FAMILY_NAME],
    thumbnailPicture: image?.thumbnail?.contentUrl,
    profilePicture: image?.contentUrl,
  };
}

export async function getProfile(did: string): Promise<ProfileWithDID | null> {
  const links = await getAgentLinks(did);

  const profile: Profile = {
    username: '',
    bio: '',
    email: '',
    givenName: '',
    familyName: ''
  };

  for (const link of links.filter(e => e.data.source === 'flux://profile')) {
    let expUrl;
    let image;

    switch (link.data.predicate) {
      case "sioc://has_username":
        profile!.username = link.data.target;
        break;
      case "sioc://has_bio":
        profile!.username = link.data.target;
        break;
      case "sioc://has_given_name":
        profile!.givenName = link.data.target;
        break;
      case "sioc://has_family_name":
        profile!.familyName = link.data.target;
        break;
      case "sioc://has_profile_image":
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);
    
        if (image) {
          profile!.profilePicture = image.data.slice(1, -1);
        }
        break;
      case "sioc://has_profile_thumbnail_image":
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === "flux://profile") {
            profile!.thumbnailPicture = image.data.slice(1, -1);
          }
        }
        break;
      case "sioc://has_bg_image":
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === "flux://profile") {
            profile!.profileBg = image.data.slice(1, -1);
          }
        }
        break;
      case "sioc://has_email":
        profile!.email = link.data.target;
        break;
      default:
        break;
    }
  }

  return {...profile, did}
}

