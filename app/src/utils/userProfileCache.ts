import { Ad4mClient } from '@coasys/ad4m';
import { getProfile } from '@coasys/flux-api';
import { Profile } from '@coasys/flux-types';

const defaultProfile: Profile = {
  did: '',
  username: '',
  bio: '',
  email: '',
  givenName: '',
  familyName: '',
  profileBackground: '',
  profileThumbnailPicture: '',
  profilePicture: '',
};

const profileCache: Record<string, Profile> = {};
const inflight: Record<string, Promise<Profile>> = {};

export async function getCachedAgentProfile(did: string, client: Ad4mClient, refresh?: boolean): Promise<Profile> {
  // Return the cached profile if it already exists (skip when refreshing)
  if (!refresh && profileCache[did]) return profileCache[did];

  // Deduplicate concurrent requests for the same DID
  if (!refresh && inflight[did]) return inflight[did];

  const promise = (async () => {
    try {
      // Fetch the profile and store it in the cache
      const profile = await getProfile(did, client);
      if (profile) {
        const p = { ...profile, did };
        profileCache[did] = p;
        return p;
      }
    } catch (error) {
      console.error(`Error fetching profile for ${did}:`, error);
    } finally {
      delete inflight[did];
    }

    // Return an empty profile with the users DID if nothing found
    return { ...defaultProfile, did };
  })();

  inflight[did] = promise;
  return promise;
}
