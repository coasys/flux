import { createProfile } from "@/core/methods/createProfile";
import { getExpression } from "@/core/queries/getExpression";
import getSnapshotByUUID from "@/core/queries/getSnapshotByUUID";
import {
  Link,
  LinkExpression,
  PerspectiveInput,
  linkEqual,
} from "@perspect3vism/ad4m";

import { ExpressionTypes, Profile, ProfileExpression } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { useDataStore } from "@/store/data";
import { profileCache } from "@/app";
import getAgentLinks from "@/utils/getAgentLinks";
import { ad4mClient } from "@/app";
import { link } from "original-fs";
import getByDid from "@/core/queries/getByDid";
import removeTypeName from "@/utils/removeTypeName";

function getProfileLinks(links: LinkExpression[]) {
  return {
    username: links.find((l) => l.data.predicate === "sioc://username"),
  };
}

function createProfileLinks(user: any) {
  return {
    username: new Link({
      source: "flux://profile",
      target: user.username,
      predicate: "sioc://username",
    }),
  };
}

function updateProfileLinks(oldLinks: any, newLinks: any, uuid: string) {
  Object.keys(newLinks).map((key) => {
    const newLink = newLinks[key];
    const oldLink = removeTypeName(oldLinks[key]);

    if (oldLink) {
      ad4mClient.perspective.updateLink(uuid, oldLink, newLink);
    } else if (linkEqual(oldLink, newLink)) {
      return;
    } else {
      ad4mClient.perspective.addLink(uuid, newLink);
    }
  });
}

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
  bio?: string;
}

export default async (payload: Payload): Promise<void> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  const currentProfile = userStore.getProfile;
  const newProfile = {
    ...currentProfile,
    ...payload,
  } as Profile;

  userStore.setUserProfile(newProfile);

  try {
    const userPerspectiveId = userStore.getFluxPerspectiveId!;

    const perspective = await ad4mClient.perspective.snapshotByUUID(
      userPerspectiveId
    );

    const links: any = perspective?.links || [];

    const oldProfileLinks = getProfileLinks(links);
    const newProfileLinks = createProfileLinks(newProfile);

    updateProfileLinks(
      oldProfileLinks,
      newProfileLinks,
      userStore.getFluxPerspectiveId!
    );
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
