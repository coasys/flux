import { profile } from "@fluxapp/constants";
import { Profile } from "@fluxapp/types";
import { mapLiteralLinks } from "@fluxapp/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

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

export default async function getProfile(did: string): Promise<Profile> {
  const cleanedDid = did.replace("did://", "");
  const client: Ad4mClient = await getAd4mClient();

  let profile: Profile = {
    username: "",
    bio: "",
    email: "",
    profileBackground: "",
    profilePicture: "",
    profileThumbnailPicture: "",
    givenName: "",
    familyName: "",
    did: "",
  };

  const agentPerspective = await client.agent.byDID(cleanedDid);

  if (agentPerspective) {
    const links = agentPerspective!.perspective!.links;

    const mappedAd4mProfile: any = mapLiteralLinks(
      links.filter((e) => e.data.source === did),
      {
        username: HAS_USERNAME,
      }
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
      }
    );

    if (mappedProfile.profilePicture) {
      const res = await client.expression.get(
        mappedProfile.profilePicture
      );
      if (res) {
        const { data } = res;
        const { data_base64, file_type } = JSON.parse(data);
        mappedProfile.profilePicture =
          data_base64 && `data:${file_type};base64, ${data_base64}`;
      }
    }

    if (mappedProfile.profileThumbnailPicture) {
      const res = await client.expression.get(
        mappedProfile.profileThumbnailPicture
      );
      if (res) {
        const { data } = res;
        const { data_base64, file_type } = JSON.parse(data);

        mappedProfile.profileThumbnailPicture =
          data_base64 && `data:${file_type};base64, ${data_base64}`;
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
