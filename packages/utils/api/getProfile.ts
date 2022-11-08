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
import { DexieProfile } from "../helpers/storageHelpers";
import { Profile } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { mapLiteralLinks } from "../helpers/linkHelpers";

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const client = await getAd4mClient();

    if (expUrl) {
      try {
        setTimeout(() => {
          resolve("");
        }, 1000);

        const image = await client.expression.get(expUrl);

        if (image) {
          resolve(image.data.slice(1, -1));
        }

        resolve("");
      } catch (e) {
        console.error(e);
        resolve("");
      }
    } else {
      resolve("");
    }
  });
}

export default async function getProfile(did: string): Promise<Profile> {
  const client = await getAd4mClient();

  let profile: Profile = {
    username: "",
    bio: "",
    email: "",
    profileBg: "",
    profilePicture: "",
    thumbnailPicture: "",
    givenName: "",
    familyName: "",
    did: "",
  };

  if (typeof did === "string") {
    const cleanedDid = did.replace("did://", "");

    profile.did = cleanedDid;

    const agentPerspective = await client.agent.byDID(cleanedDid);

    console.log(agentPerspective.perspective?.links);

    if (agentPerspective) {
      const links = agentPerspective!.perspective!.links;

      const dexie = new DexieProfile(`flux://profile`, 1);

      let cachedProfile = await dexie.get(cleanedDid);

      if (cachedProfile) {
        return cachedProfile as Profile;
      }

      const mappedProfile: any = mapLiteralLinks(
        links.filter((e) => e.data.source === FLUX_PROFILE),
        {
          username: HAS_USERNAME,
          bio: HAS_BIO,
          givenName: HAS_GIVEN_NAME,
          email: HAS_EMAIL,
          familyName: HAS_FAMILY_NAME,
          profilePicture: HAS_PROFILE_IMAGE,
          thumbnailPicture: HAS_THUMBNAIL_IMAGE,
          profileBg: HAS_BG_IMAGE,
        }
      );

      profile = {
        ...mappedProfile,
        did: cleanedDid,
      };

      dexie.save(cleanedDid, profile as Profile);
    }
  }

  return profile;
}
