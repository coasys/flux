import { Ad4mClient } from '@coasys/ad4m';
import { getAd4mClient } from '@coasys/ad4m-connect/utils';
import { profile } from '@coasys/flux-constants';
import { mapLiteralLinks } from '@coasys/flux-utils';

const { AD4M_PREDICATE_USERNAME, AD4M_PREDICATE_FIRSTNAME, AD4M_PREDICATE_LASTNAME } = profile;

type Ad4mProfile = {
  username: string;
  name: string;
  familyName: string;
};

export default async function getAd4mProfile(client?: Ad4mClient): Promise<Ad4mProfile> {
  const ad4mClient = client || await getAd4mClient();

  const me = await ad4mClient.agent.me();

  const profile = mapLiteralLinks(me.perspective!.links, {
    username: AD4M_PREDICATE_USERNAME,
    name: AD4M_PREDICATE_FIRSTNAME,
    familyName: AD4M_PREDICATE_LASTNAME,
  }) as Ad4mProfile;

  return profile;
}
