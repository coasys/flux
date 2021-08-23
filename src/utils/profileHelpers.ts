import { getExpressionNoCache } from "@/core/queries/getExpression";
import { ProfileExpression } from "@/store/types";
import { TimeoutCache } from "./timeoutCache";
import { Profile } from "@/store/types";
import {
  ACCOUNT_NAME,
  EMAIL,
  FAMILY_NAME,
  GIVEN_NAME,
} from "@/constants/profile";
import { IMAGE, CONTENT_SIZE, CONTENT_URL, THUMBNAIL } from "@/constants/image";

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

export function parseProfile(data: any): Profile {
  const profile = shouldParse(data) ? JSON.parse(data) : data;
  const image = profile[IMAGE] && parseImage(profile[IMAGE]);

  return {
    username: profile[ACCOUNT_NAME],
    email: profile[EMAIL],
    givenName: profile[GIVEN_NAME],
    familyName: profile[FAMILY_NAME],
    thumbnailPicture: image?.thumbnail?.contentUrl,
    profilePicture: image?.contentUrl,
  };
}

export async function getProfile(
  profileLangAddress: string,
  did: string
): Promise<ProfileExpression | null> {
  const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

  const profileLink = `${profileLangAddress}://${did}`;

  const profile = cache.get(profileLink);

  if (!profile) {
    console.warn(
      "Did not get profile expression from cache, calling holochain"
    );
    const profileGqlExp = await getExpressionNoCache(profileLink);
    if (profileGqlExp) {
      const profileExp = {
        author: profileGqlExp.author!,
        data: JSON.parse(profileGqlExp.data!),
        timestamp: profileGqlExp.timestamp!,
        proof: profileGqlExp.proof!,
      } as ProfileExpression;

      cache.set(profileLink, profileExp);

      return profileExp;
    } else {
      return null;
    }
  }

  return profile;
}
