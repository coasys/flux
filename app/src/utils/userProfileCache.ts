import { Profile } from "@coasys/flux-types";
import { getProfile } from "@coasys/flux-api";

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

export async function getCachedAgentProfile(did: string): Promise<Profile> {
    // Return the cached profile if it already exists
    if (profileCache[did]) return profileCache[did];

    try {
        // Otherwise fetch the profile and store it in the cache
        const profile = await getProfile(did);
        if (profile) {
            profileCache[did] = profile;
            return profile;
        }
    } catch (error) {
        console.error(`Error fetching profile for ${did}:`, error);
    }

    // Return an empty profile with the users DID if nothing found
    return { ...defaultProfile, did };
}
