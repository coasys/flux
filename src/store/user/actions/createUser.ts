import { ad4mClient } from "@/app";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { blobToDataURL, dataURItoBlob, resizeImage } from "@/core/methods/createProfile";

import { useAppStore } from "@/store/app";
import getAgentLinks from "@/utils/getAgentLinks";
import removeTypeName from "@/utils/removeTypeName";
import { Link, PerspectiveInput } from "@perspect3vism/ad4m";
import { useUserStore } from "..";

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  email: string;
  profilePicture?: string;
  thumbnailPicture?: string;
}

export default async ({
  givenName = "",
  familyName = "",
  email = "",
  username,
  profilePicture
}: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const resizedImage = profilePicture
      ? await resizeImage(dataURItoBlob(profilePicture as string), 100)
      : undefined;
    
    const thumbnail = profilePicture
      ? await blobToDataURL(resizedImage!)
      : undefined;

      
    const perspectives = await ad4mClient.perspective.all();
    const userPerspective = perspectives.find(e => e.name === "Agent Profile");
    const currentLinks = await getAgentLinks(userStore.agent.did!, userPerspective?.uuid);
    const tempLinks = [...currentLinks];
    
    if (profilePicture) {
      const thumbnailImage = await ad4mClient.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImage = await ad4mClient.expression.create(
        profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImageLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: "flux://profile",
          target: profileImage,
          predicate: `sioc://has_profile_image`,
        })
      );
  
      const thumbnailImageLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: "flux://profile",
          target: thumbnailImage,
          predicate: `sioc://has_profile_thumbnail_image`,
        })
      );

      tempLinks.push(profileImageLink, thumbnailImageLink);
    }

    if (givenName) {
      const givenNameLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: "flux://profile",
          target: givenName,
          predicate: "sioc://has_given_name",
        })
      );

      tempLinks.push(givenNameLink);
    }

    if (familyName) {
      const familyNameLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: "flux://profile",
          target: familyName,
          predicate: "sioc://has_family_name",
        })
      );

      tempLinks.push(familyNameLink);
    }

    if (email) {
      const emailLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: "flux://profile",
          target: email,
          predicate: "sioc://has_email",
        })
      );

      tempLinks.push(emailLink);
    }

    if (username) {
      const userNameLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: "flux://profile",
          target: username,
          predicate: "sioc://has_username",
        })
      );

      tempLinks.push(userNameLink);
    }

    const links = [];
    for (const link of tempLinks) {
      links.push(removeTypeName(link));
    }

    await ad4mClient.agent.updatePublicPerspective({
      links,
    } as PerspectiveInput);

    userStore.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture: thumbnail,
      bio: ""
    });

    const status = await ad4mClient.agent.status();

    userStore.updateAgentStatus(status);

    userStore.addFluxPerspectiveId(userPerspective?.uuid!)
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
