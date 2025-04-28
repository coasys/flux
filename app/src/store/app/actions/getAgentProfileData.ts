import { getProfile } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { useAppStore } from "@/store/app";
import { getImage } from "@coasys/flux-utils";

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

export default async function getAgentProfileData(did: string): Promise<Profile> {
    const appStore = useAppStore();

    // Check if the profile is already cached and return it if found
    const cachedProfile = appStore.userProfilesCache[did];
    if (cachedProfile) return cachedProfile;

    try {
        // If not cached, fetch the profile and image to store in the cache
        const profile = await getProfile(did);
        if (profile) {
            // Get the image from the file storage language if not already in base64
            let imagePath = "";
            const { profilePicture } = profile;
            if (typeof profilePicture === "string") {
                imagePath = profilePicture.includes("base64")
                    ? profilePicture
                    : await getImage(profilePicture);
            }

            const profileWithImage = { ...profile, profileThumbnailPicture: imagePath };
            appStore.userProfilesCache[profile.did] = profileWithImage;

            return profileWithImage;
        }
    } catch (error) {
        console.error(`Error fetching profile for ${did}:`, error);
    }

    // If no profile found, return an empty profile with the users did
    return { ...defaultProfile, did };
}
