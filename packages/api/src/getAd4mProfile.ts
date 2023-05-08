import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { profile } from "@fluxapp/constants";
import { mapLiteralLinks } from "@fluxapp/utils";

const {
  AD4M_PREDICATE_USERNAME,
  AD4M_PREDICATE_FIRSTNAME,
  AD4M_PREDICATE_LASTNAME,
} = profile;

type Ad4mProfile = {
  username: string;
  name: string;
  familyName: string;
};

export default async function getAd4mProfile(): Promise<Ad4mProfile> {
  const client = await getAd4mClient();

  const me = await client.agent.me();

  const profile = mapLiteralLinks(me.perspective!.links, {
    username: AD4M_PREDICATE_USERNAME,
    name: AD4M_PREDICATE_FIRSTNAME,
    familyName: AD4M_PREDICATE_LASTNAME,
  }) as Ad4mProfile;

  return profile;
}
