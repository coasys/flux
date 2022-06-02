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
import { ExpressionRendered } from "@perspect3vism/ad4m";
import { GET_EXPRESSION } from "@/core/graphql_queries";

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

export async function getProfile(
  profileLangAddress: string,
  did: string
): Promise<ProfileWithDID | null> {
  return new Promise(async (resolve) => {
    const profileRef = `${profileLangAddress}://${did}`;

    const profileExp = await profileCache.get(profileRef);

  if (!profileExp) {
    console.warn(
      "Did not get profile expression from cache, calling holochain"
    );
      const id = setTimeout(() => {
        resolve(null);
      }, 10000);
      
      const profileGqlExp = await ad4mClient.expression.get(profileRef);

      clearTimeout(id);

      if (profileGqlExp) {
        const exp = {
          author: profileGqlExp.author!,
          data: JSON.parse(profileGqlExp.data),
          timestamp: profileGqlExp.timestamp!,
          proof: profileGqlExp.proof!,
        } as ProfileExpression;

        await profileCache.set(profileRef, exp);

        resolve({
          did,
          ...parseProfile(exp.data.profile),
        });
      } else {
        resolve(null);
      }
    } else {
      resolve({
        did,
        ...parseProfile(profileExp.data.profile),
      });
    }
  });
}
