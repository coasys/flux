import {
  USERNAME,
  GIVEN_NAME,
  FAMILY_NAME,
  EMAIL,
  PROFILE_IMAGE,
  PROFILE_THUMBNNAIL_IMAGE,
  FLUX_PROFILE,
  BG_IMAGE,
  BIO,
} from "../constants/profile";
import { DexieProfile } from "../helpers/storageHelpers";
import { Profile } from "../types";
import ad4mClient from "./client";

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => {
      resolve("");
    }, 1000);

    try {
      const image = await ad4mClient.expression.get(expUrl);
      
      if (image) {
        resolve(image.data.slice(1, -1));
      }

      resolve("")
    } catch (e) {
      console.error(e)
      resolve("");
    }
  })
}

export default async function getProfile(did: string): Promise<any | null> {
  const cleanedDid = did.replace('did://', '');
  const profile: any = {
    username: "",
    bio: "",
    email: "",
    profileBg: "",
    profilePicture: "",
    thumbnailPicture: "",
    givenName: "",
    familyName: "",
    did: cleanedDid,
  };

  const agentPerspective = await ad4mClient.agent.byDID(cleanedDid);

  if (agentPerspective) {
    const links = agentPerspective!.perspective!.links;

    const dexie = new DexieProfile(`flux://profile`, 1);
  
    let cachedProfile = await dexie.get(cleanedDid);
  
    if (cachedProfile) {
      return cachedProfile as Profile;
    }
  
    for (const link of links.filter((e) => e.data.source === FLUX_PROFILE)) {  
      switch (link.data.predicate) {
        case USERNAME:
          profile!.username = link.data.target;
          break;
        case BIO:
          profile!.username = link.data.target;
          break;
        case GIVEN_NAME:
          profile!.givenName = link.data.target;
          break;
        case FAMILY_NAME:
          profile!.familyName = link.data.target;
          break;
        case PROFILE_THUMBNNAIL_IMAGE:
          profile!.thumbnailPicture = link.data.target;
          break;
        case EMAIL:
          profile!.email = link.data.target;
          break;
        default:
          break;
      }
    }
  
    dexie.save(cleanedDid, profile);
  }

  return profile;
}
