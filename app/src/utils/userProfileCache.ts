import { getProfile } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";

const defaultProfile: Profile = {
  did: "",
  username: "",
  bio: "",
  email: "",
  givenName: "",
  familyName: "",
  profileBackground: "",
  profileThumbnailPicture: "",
  profilePicture: "",
};

const profileCache: Record<string, Profile> = {};

export async function getCachedAgentProfile(did: string, refresh?: boolean): Promise<Profile> {
  // Return the cached profile if it already exists (skip when refreshing)
  if (!refresh && profileCache[did]) return profileCache[did];

  try {
    // Otherwise fetch the profile and store it in the cache
    const profile = await getProfile(did);
    if (profile) {
      const profileWithDid = { ...profile, did };
      profileCache[did] = profileWithDid;
      return profileWithDid;
    }
  } catch (error) {
    console.error(`Error fetching profile for ${did}:`, error);
  }

  // Return an empty profile with the users DID if nothing found
  return { ...defaultProfile, did };
}
