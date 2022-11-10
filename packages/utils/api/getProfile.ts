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

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export default async function getProfile(did: string): Promise<Profile> {
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

  if (typeof did === "string") {
    const cleanedDid = did.replace("did://", "");

    profile.did = cleanedDid;

    const agentPerspective = await client.agent.byDID(cleanedDid);

    if (agentPerspective) {
      const links = agentPerspective!.perspective!.links;

      // const dexie = new DexieProfile(`flux://profile`, 1);

      // console.log("get profile", links);
      // let cachedProfile = await dexie.get(cleanedDid);
      // console.log("got cached profile", cachedProfile);

      // if (cachedProfile) {
      //   return cachedProfile as Profile;
      // }

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

      //dexie.save(cleanedDid, profile as Profile);
    }
  }

  return profile;
}
