import { getExpressionNoCache } from "@/core/queries/getExpression";
import { Profile } from "@/store";
import type Expression from "@perspect3vism/ad4m/Expression";
import { TimeoutCache } from "./timeoutCache";

export function toProfile(did: string, obj: { [x: string]: any }): Profile {
  const profile: Profile = {
    username: obj["foaf:AccountName"],
    email: obj["schema:email"],
    familyName: obj["schema:familyName"],
    givenName: obj["schema:givenName"],
    thumbnailPicture: undefined,
    profilePicture: undefined,
    address: did,
  };

  if (obj["schema:image"]) {
    profile.profilePicture = obj["schema:image"]["schema:contentUrl"];
    profile.thumbnailPicture =
      obj["schema:image"]["schema:thumbnail"]["schema:contentUrl"];
  }

  return profile;
}

export async function getProfile(
  profileLangAddress: string,
  did: string
): Promise<Expression | null> {
  const cache = new TimeoutCache<Expression>(1000 * 60 * 60);

  const profileLink = `${profileLangAddress}://${did}`;

  const profile = cache.get(profileLink);

  if (!profile) {
    const profileGqlExp = await getExpressionNoCache(profileLink);
    if (profileGqlExp) {
      const profileExp = {
        author: profileGqlExp.author!,
        data: JSON.parse(profileGqlExp.data!),
        timestamp: profileGqlExp.timestamp!,
        proof: profileGqlExp.proof!,
      } as Expression;
  
      cache.set(profileLink, profileExp);
  
      return profileExp;
    } else {
      return null;
    }
  }

  return profile;
}
