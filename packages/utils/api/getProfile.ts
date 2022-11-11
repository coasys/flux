import {
  HAS_USERNAME,
  HAS_GIVEN_NAME,
  HAS_FAMILY_NAME,
  HAS_EMAIL,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
} from "../constants/profile";
import { Profile } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { mapLiteralLinks } from "../helpers/linkHelpers";
import { DexieProfile } from "../helpers/storageHelpers";

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export default async function getProfile(did: string): Promise<Profile> {
  const cleanedDid = did.replace("did://", "");
  const client = await getAd4mClient();

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

  const dexie = new DexieProfile(`flux://profile`, 1);
  let cachedProfile = await dexie.get(cleanedDid);

  if (cachedProfile) {
    return cachedProfile as Profile;
  }

  profile.did = cleanedDid;
  const agentPerspective = await client.agent.byDID(cleanedDid);

  if (agentPerspective) {
    const links = agentPerspective!.perspective!.links;

    const mappedProfile: any = mapLiteralLinks(
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

    profile = {
      ...mappedProfile,
      did: cleanedDid,
    };

    dexie.save(cleanedDid, profile as Profile);
  }

  return profile;
}
