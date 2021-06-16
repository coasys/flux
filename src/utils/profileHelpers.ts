import { getExpression } from "@/core/queries/getExpression";
import { Profile } from "@/store";
import type Expression from "@perspect3vism/ad4m/Expression";

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
): Promise<Expression> {
  const profileLink = `${profileLangAddress}://${did}`;

  const profileGqlExp = await getExpression(profileLink);
  const profileExp = {
    author: profileGqlExp.author!,
    data: JSON.parse(profileGqlExp.data!),
    timestamp: profileGqlExp.timestamp!,
    proof: profileGqlExp.proof!,
  } as Expression;
  //console.log("Returning", profileExp);

  return profileExp;
}
