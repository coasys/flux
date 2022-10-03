import { Profile } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { useDataStore } from "@/store/data";
import { Link, LinkExpression, PerspectiveInput } from "@perspect3vism/ad4m";
import removeTypeName from "@/utils/removeTypeName";
import getAgentLinks from "@/utils/getAgentLinks";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { FLUX_PROFILE, FLUX_PROXY_PROFILE_NAME, HAS_BG_IMAGE, HAS_BIO, HAS_PROFILE_IMAGE, HAS_THUMBNAIL_IMAGE, HAS_USERNAME } from "@/constants/profile";
import { resizeImage, dataURItoBlob, blobToDataURL } from "@/utils/profileHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
  bio?: string;
  profileBg?: string;
}

async function removeLink(links: LinkExpression[], link: Link) {
  const userStore = useUserStore();
  const userPerspective = userStore.getAgentProfileProxyPerspectiveId;
  const client = await getAd4mClient();

  const foundLink = links.find(
    (e) => e.data.predicate === link.predicate
  );

  if (foundLink) {
    const link = removeTypeName(foundLink);
    await client.perspective.removeLink(userPerspective!, link);
  }
}

async function replaceLink(links: LinkExpression[], newLink: Link) {
  const userStore = useUserStore();
  const userPerspective = userStore.getAgentProfileProxyPerspectiveId;
  const client = await getAd4mClient();

  const foundLink = links.find(
    (e) => e.data.predicate === newLink.predicate
  );

  if (foundLink) {
    const link = removeTypeName(foundLink);
    await client.perspective.removeLink(userPerspective!, link);
  }

  const linked = await client.perspective.addLink(
    userPerspective!,
    newLink
  );

  return linked;
}

export default async (payload: Payload): Promise<void> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();
  const client = await getAd4mClient();

  const currentProfile = userStore.getProfile;
  // TODO: add profilebg here.
  const newProfile = {
    username: payload.username || currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: payload.profilePicture || currentProfile?.profilePicture,
    thumbnailPicture: payload.thumbnail || currentProfile?.thumbnailPicture,
    bio: payload.bio || currentProfile?.bio
  } as Profile;
  
  const perspectives = await client.perspective.all();
  const userPerspective = perspectives.find(e => e.name === FLUX_PROXY_PROFILE_NAME);

  if (userPerspective) {
    userStore.addAgentProfileProxyPerspectiveId(userPerspective.uuid)
  } else {
    const error = "No user perspective found";
    appStore.showDangerToast({
      message: error,
    });
    throw new Error(error)
  }

  try {
    const links = await getAgentLinks(userStore.agent.did!, userPerspective.uuid);

    const tempLinks = [...links];

    if (payload.bio) {    
      const bioLink = await replaceLink(links, new Link({
        source: FLUX_PROFILE,
        target: newProfile.bio,
        predicate: HAS_BIO,
      }));
    
      tempLinks.push(bioLink);
    } else {
      removeLink(links, new Link({
        source: FLUX_PROFILE,
        target: newProfile.bio,
        predicate: HAS_BIO,
      }));
    }

    const usernameLink = await replaceLink(links, new Link({
      source: FLUX_PROFILE,
      target: newProfile.username,
      predicate: HAS_USERNAME,
    }));

    let profileImageLink: any = null;
    let thumbnailImageLink: any = null;
    let profileBgLink: any = null;

    if (payload.profileBg) {
      const image = await client.expression.create(
        payload.profileBg,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileBgLink = await replaceLink(links, new Link({
        source: FLUX_PROFILE,
        target: image,
        predicate: HAS_BG_IMAGE,
      }));

      tempLinks.push(profileBgLink);
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

      profileImageLink = await replaceLink(
        links,
        new Link({
          source: FLUX_PROFILE,
          target: profileImage,
          predicate: HAS_PROFILE_IMAGE,
        })
      );
  
      thumbnailImageLink = await replaceLink(
        links,
        new Link({
          source: FLUX_PROFILE,
          target: thumbnailImage,
          predicate: HAS_THUMBNAIL_IMAGE,
        })
      );

      tempLinks.push(profileImageLink, thumbnailImageLink);
    }

    const finalLinks = [];
    for (const link of [
      ...tempLinks,
      usernameLink
    ]) {
      finalLinks.push(removeTypeName(link));
    }

  userStore.setUserProfile({
    ...newProfile,
    profilePicture: profileImageLink?.data?.target || null,
    thumbnailPicture: thumbnailImageLink?.data?.target || null,
    profileBg: profileBgLink || null
  });


    await client.agent.updatePublicPerspective({
      links: finalLinks,
    } as PerspectiveInput);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
