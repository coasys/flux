import { Profile } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { Link, LinkMutations } from "@perspect3vism/ad4m";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import { FLUX_PROFILE, HAS_BG_IMAGE, HAS_BIO, HAS_PROFILE_IMAGE, HAS_THUMBNAIL_IMAGE, HAS_USERNAME } from "utils/constants/profile";
import { resizeImage, dataURItoBlob, blobToDataURL } from "utils/helpers/profileHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
  bio?: string;
  profileBg?: string;
}

export default async (payload: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();
  const client = await getAd4mClient();

  const currentProfile = userStore.getProfile;
  const newProfile = {
    username: payload.username || currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: payload.profilePicture || currentProfile?.profilePicture,
    thumbnailPicture: payload.thumbnail || currentProfile?.thumbnailPicture,
    bio: payload.bio || currentProfile?.bio
  } as Profile;

  //try {
    const links = (await client.agent.me()).perspective?.links;

    if (!links) {
      throw new Error("No links found, cannot update the profile");
    }

    const additions = [];
    const removals = [];

    if (payload.bio) {    
      const bioLink = links.filter(link => link.data.predicate === HAS_BIO);
      if (bioLink.length > 0) {
        for (const link of bioLink) {
          removals.push(link);
        }
      }
      additions.push(new Link({
        source: FLUX_PROFILE,
        target: payload.bio,
        predicate: HAS_BIO,
      }));
    } else {
      const bioLink = links.filter(link => link.data.predicate === HAS_BIO);
      if (bioLink.length > 0) {
        for (const link of bioLink) {
          removals.push(link);
        }
      }
    }

    if (payload.username) {
      const usernameLink = links.filter(link => link.data.predicate === HAS_USERNAME);
      if (usernameLink.length > 0) {
        for (const username of usernameLink) {
          removals.push(username);
        }
      }
      additions.push(new Link({
        source: FLUX_PROFILE,
        target: payload.username,
        predicate: HAS_USERNAME,
      }));
    };

    let profileImageLink: any = null;
    let thumbnailImageLink: any = null;
    let profileBgLink: any = null;

    if (payload.profileBg) {
      const image = await client.expression.create(
        payload.profileBg,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );
      const profileBgLink = links.filter(link => link.data.predicate === HAS_BG_IMAGE);
      if (profileBgLink.length > 0) {
        for (const profileBg of profileBgLink) {
          removals.push(profileBg);
        }
      }
      additions.push(new Link({
        source: FLUX_PROFILE,
        target: image,
        predicate: HAS_BG_IMAGE,
      }));
    } else {
      const profileBgLink = links.filter(link => link.data.predicate === HAS_BG_IMAGE);
      if (profileBgLink.length > 0) {
        for (const profileBg of profileBgLink) {
          removals.push(profileBg);
        }
      }
    }

    if (payload.profilePicture) {
      const resizedImage = payload.profilePicture
        ? await resizeImage(dataURItoBlob(payload.profilePicture as string), 100)
        : undefined;
    
      const thumbnail = payload.profilePicture
        ? await blobToDataURL(resizedImage!)
        : undefined;

      const thumbnailImage = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImage = await client.expression.create(
        payload.profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImageLink = links.filter(link => link.data.predicate === HAS_PROFILE_IMAGE);
      const thumbnailImageLink = links.filter(link => link.data.predicate === HAS_THUMBNAIL_IMAGE);

      if (profileImageLink.length > 0) {
        for (const profileImage of profileImageLink) {
          removals.push(profileImage);
        }
      };
      if (thumbnailImageLink.length > 0) {
        for (const thumbnailImage of thumbnailImageLink) {
          removals.push(thumbnailImage);
        }
      };

      additions.push(new Link({
        source: FLUX_PROFILE,
        target: profileImage,
        predicate: HAS_PROFILE_IMAGE,
      }));
      additions.push(new Link({
        source: FLUX_PROFILE,
        target: thumbnailImage,
        predicate: HAS_THUMBNAIL_IMAGE,
      }));
    } else {
      const profileImageLink = links.filter(link => link.data.predicate === HAS_PROFILE_IMAGE);
      const thumbnailImageLink = links.filter(link => link.data.predicate === HAS_THUMBNAIL_IMAGE);

      if (profileImageLink.length > 0) {
        for (const profileImage of profileImageLink) {
          removals.push(profileImage);
        }
      };
      if (thumbnailImageLink.length > 0) {
        for (const thumbnailImage of thumbnailImageLink) {
          removals.push(thumbnailImage);
        }
      };
    };

    await client.agent.mutatePublicPerspective({additions, removals} as LinkMutations);

    userStore.setUserProfile({
      ...newProfile,
      profilePicture: profileImageLink?.data?.target || null,
      thumbnailPicture: thumbnailImageLink?.data?.target || null,
      profileBg: profileBgLink || null
    });
  //}
  //  catch (e) {
  //   appStore.showDangerToast({
  //     message: e.message,
  //   });
  //   throw new Error(e);
  // }
};
