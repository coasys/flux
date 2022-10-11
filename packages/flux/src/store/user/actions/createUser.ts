import { AD4M_AGENT, KAICHAO_AGENT, JUNTO_AGENT } from "utils/constants/agents";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import { FLUX_PROFILE, FLUX_PROXY_PROFILE_NAME, HAS_EMAIL, HAS_FAMILY_NAME, HAS_GIVEN_NAME, HAS_PROFILE_IMAGE, HAS_THUMBNAIL_IMAGE, HAS_USERNAME } from "utils/constants/profile";

import { useAppStore } from "@/store/app";
import getAgentLinks from "utils/api/getAgentLinks";
import { resizeImage, dataURItoBlob, blobToDataURL } from "utils/helpers/profileHelpers";
import removeTypeName from "utils/helpers/removeTypeName";
import { Link, LinkExpression, PerspectiveInput } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
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
  const client = await getAd4mClient();

  try {
    //Install the noteipfs language
    await client.runtime.addTrustedAgents([AD4M_AGENT, KAICHAO_AGENT, JUNTO_AGENT]);
    await client.languages.byAddress(NOTE_IPFS_EXPRESSION_OFFICIAL);

    const resizedImage = profilePicture
      ? await resizeImage(dataURItoBlob(profilePicture as string), 100)
      : undefined;
    
    const thumbnail = profilePicture
      ? await blobToDataURL(resizedImage!)
      : undefined;

    const perspectives = await client.perspective.all();
    let userPerspective = perspectives.find(e => e.name === FLUX_PROXY_PROFILE_NAME);
    let currentLinks = [] as LinkExpression[];
    if (userPerspective) {
      currentLinks = await getAgentLinks(userStore.agent.did!, userPerspective?.uuid);
    } else {
      userPerspective = await client.perspective.add(FLUX_PROXY_PROFILE_NAME);
    };
    const tempLinks = [...currentLinks];

    let profileImageLink = null;
    let thumbnailImageLink = null;
    
    if (profilePicture) {
      const thumbnailImage = await client.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImage = await client.expression.create(
        profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      profileImageLink = await client.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: profileImage,
          predicate: HAS_PROFILE_IMAGE,
        })
      );
  
      thumbnailImageLink = await client.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: thumbnailImage,
          predicate: HAS_THUMBNAIL_IMAGE,
        })
      );

      tempLinks.push(profileImageLink, thumbnailImageLink);
    }

    if (givenName) {
      const givenNameLink = await client.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: givenName,
          predicate: HAS_GIVEN_NAME,
        })
      );

      tempLinks.push(givenNameLink);
    }

    if (familyName) {
      const familyNameLink = await client.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: familyName,
          predicate: HAS_FAMILY_NAME,
        })
      );

      tempLinks.push(familyNameLink);
    }

    if (email) {
      const emailLink = await client.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: email,
          predicate: HAS_EMAIL,
        })
      );

      tempLinks.push(emailLink);
    }

    if (username) {
      const userNameLink = await client.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: username,
          predicate: HAS_USERNAME,
        })
      );

      tempLinks.push(userNameLink);
    }

    const links = [];
    for (const link of tempLinks) {
      links.push(removeTypeName(link));
    }

    const me = await client.agent.me();
    const existingAgentLinks = me.perspective?.links;
    if (existingAgentLinks) {
      for (const link of existingAgentLinks) {
        links.push(removeTypeName(link));
      }
    }

    await client.agent.updatePublicPerspective({
      links,
    } as PerspectiveInput);

    userStore.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture: profileImageLink?.data?.target || null,
      thumbnailPicture: thumbnailImageLink?.data?.target || null,
      bio: ""
    });

    const status = await client.agent.status();

    userStore.updateAgentStatus(status);

    userStore.addAgentProfileProxyPerspectiveId(userPerspective?.uuid!)
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
