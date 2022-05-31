import { ProfileExpression, ProfileWithDID } from "@/store/types";
import { Profile } from "@/store/types";
import {
  ACCOUNT_NAME,
  EMAIL,
  FAMILY_NAME,
  GIVEN_NAME,
} from "@/constants/profile";
import { IMAGE, CONTENT_SIZE, CONTENT_URL, THUMBNAIL } from "@/constants/image";
import { ad4mClient, apolloClient, profileCache } from "@/app";
import { ExpressionRendered, LinkExpression } from "@perspect3vism/ad4m";
import { GET_EXPRESSION } from "@/core/graphql_queries";
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

function getExpressionNoCache(url: string): Promise<ExpressionRendered | null> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{
        expression: ExpressionRendered;
      }>({
        query: GET_EXPRESSION,
        variables: { url: url },
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        resolve(result.data.expression);
      })
      .catch((error) => reject(error));
  });
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

  const bioLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_bio"
  ) as LinkExpression;

  const usernameLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_username"
  ) as LinkExpression;

  const givenNameLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_given_name"
  ) as LinkExpression;

  const familyNameLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_family_name"
  ) as LinkExpression;

  const profilePictureLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_profile_image"
  ) as LinkExpression;

  const thumbnailLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_profile_thumbnail_image"
  ) as LinkExpression;

  const emailLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_email"
  ) as LinkExpression;

  const bgImageLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_bg_image"
  ) as LinkExpression;

  if (bgImageLink) {
    const expUrl = bgImageLink.data.target;
    const image = await ad4mClient.expression.get(expUrl);

    if (image) {
      if (bgImageLink.data.source === "flux://profile") {
        profile.profileBg = image.data.slice(1, -1);
      }
    }
  } else {
    profile.profileBg = ''
  }

  profile!.bio = bioLink ? bioLink.data.target : '';

  if (usernameLink) {
    profile!.username = usernameLink.data.target;
  }

  if (givenNameLink) {
    profile!.givenName = givenNameLink.data.target;
  }

  if (familyNameLink) {
    profile!.familyName = familyNameLink.data.target;
  }
  
  if (profilePictureLink) {
    const expUrl = profilePictureLink.data.target;
    const image = await ad4mClient.expression.get(expUrl);

    if (image) {
      if (profilePictureLink.data.source === "flux://profile") {
        profile!.profilePicture = image.data.slice(1, -1);
      }
    }
  } else {
    profile!.profilePicture = '';
  }

  if (thumbnailLink) {
    const expUrl = thumbnailLink.data.target;
    const image = await ad4mClient.expression.get(expUrl);

    if (image) {
      if (thumbnailLink.data.source === "flux://profile") {
        profile!.thumbnailPicture = image.data.slice(1, -1);
      }
    }
  } else {
    profile!.thumbnailPicture = '';
  }
  
  if (emailLink) {
    profile!.email = emailLink.data.target;
  }

  return {...profile, did}
}

