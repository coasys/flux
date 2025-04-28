import { getProfile } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { useAppStore } from "../store/app";

const defaultProfile: Profile = {
    did: "",
    username: "",
    bio: "",
    email:"",
    givenName: "",
    familyName: "",
    profileBackground: "",
    profileThumbnailPicture: "",
    profilePicture: "",
}

export async function getAgentProfileData(did: string): Promise<Profile> {
    const appStore = useAppStore();

    // Check if the profile is already cached and return it if found
    const userData = appStore.userProfilesCache.find((user: Profile) => user.did === did);
    if (userData) return userData;

    try {
        // If not cached, fetch the profile and store it in the cache
        const profile = await getProfile(did);
        if (profile) {
            appStore.cacheUserProfile(profile);
            return profile;
        }
    } catch (error) {
        console.error(`Error fetching profile for ${did}:`, error);
    }

    // If no profile found, return an empty profile with the users did
    return { ...defaultProfile, did };
}