import { profile } from '@coasys/flux-constants';
import { Profile } from '@coasys/flux-types';
import { mapLiteralLinks } from '@coasys/flux-utils';
import { Ad4mClient } from '@coasys/ad4m';
import { getAd4mClient } from '@coasys/ad4m-connect/utils';

const {
  HAS_USERNAME,
  HAS_GIVEN_NAME,
  HAS_FAMILY_NAME,
  HAS_EMAIL,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
} = profile;

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export default async function getProfile(did: string, client?: Ad4mClient): Promise<Profile> {
  const cleanedDid = did.replace('did://', '');
  const ad4mClient: Ad4mClient = client || (await getAd4mClient());

  let profile: Profile = {
    username: '',
    bio: '',
    email: '',
    profileBackground: '',
    profilePicture: '',
    profileThumbnailPicture: '',
    givenName: '',
    familyName: '',
    did: '',
  };

  const agentPerspective = await ad4mClient.agent.byDID(cleanedDid);

  if (agentPerspective) {
    const links = agentPerspective!.perspective!.links;

    const mappedAd4mProfile: any = mapLiteralLinks(
      links.filter((e) => e.data.source === did),
      {
        username: HAS_USERNAME,
      },
    );

    let mappedProfile: any = mapLiteralLinks(
      links.filter((e) => e.data.source === FLUX_PROFILE),
      {
        username: HAS_USERNAME,
        bio: HAS_BIO,
        givenName: HAS_GIVEN_NAME,
        email: HAS_EMAIL,
        familyName: HAS_FAMILY_NAME,
        profilePicture: HAS_PROFILE_IMAGE,
        profileThumbnailPicture: HAS_THUMBNAIL_IMAGE,
        profileBackground: HAS_BG_IMAGE,
      },
    );

    if (mappedProfile.profilePicture) {
      try {
        const res = await ad4mClient.expression.get(mappedProfile.profilePicture);
        if (res) {
          const { data } = res;
          const { data_base64, file_type } = JSON.parse(data);
          mappedProfile.profilePicture = data_base64 && `data:${file_type};base64, ${data_base64}`;
        }
      } catch (error) {
        console.warn('getProfile: Failed to fetch profile picture:', error);
        // Keep the IPFS hash as-is if we can't resolve it
      }
    }

    if (mappedProfile.profileThumbnailPicture) {
      try {
        const res = await ad4mClient.expression.get(mappedProfile.profileThumbnailPicture);
        if (res) {
          const { data } = res;
          const { data_base64, file_type } = JSON.parse(data);
          mappedProfile.profileThumbnailPicture = data_base64 && `data:${file_type};base64, ${data_base64}`;
        }
      } catch (error) {
        console.warn('getProfile: Failed to fetch profile thumbnail:', error);
      }
    }

    if (mappedProfile.profileBackground) {
      try {
        const res = await ad4mClient.expression.get(mappedProfile.profileBackground);
        if (res) {
          const { data } = res;
          const { data_base64, file_type } = JSON.parse(data);
          mappedProfile.profileBackground = data_base64 && `data:${file_type};base64, ${data_base64}`;
        }
      } catch (error) {
        console.warn('getProfile: Failed to fetch profile background:', error);
      }
    }

    profile = {
      ...mappedAd4mProfile,
      ...mappedProfile,
      did: did,
    };
  }

  return profile;
}
