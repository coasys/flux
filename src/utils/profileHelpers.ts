import { ProfileExpression, ProfileWithDID } from "@/store/types";
import { Profile } from "@/store/types";
import {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} from "@/constants/profile";
import getAgentLinks from "./getAgentLinks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

interface Image {
  contentUrl: string;
  contentSize: string;
}

const byteSize = (str: string) => new Blob([str]).size;

export const dataURItoBlob = (dataURI: string) => {
  const bytes =
    dataURI.split(",")[0].indexOf("base64") >= 0
      ? atob(dataURI.split(",")[1])
      : unescape(dataURI.split(",")[1]);
  const mime = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const max = bytes.length;
  const ia = new Uint8Array(max);
  for (let i = 0; i < max; i += 1) ia[i] = bytes.charCodeAt(i);
  return new Blob([ia], { type: mime });
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
};

// Resizes the image by creating a canvas and resizing it to the resized image
export const resizeImage = (file: any, maxSize: number): Promise<Blob> => {
  const reader = new FileReader();
  const image = new Image();
  const canvas = document.createElement("canvas");

  const resize = () => {
    let { width, height } = image;

    if (width > height) {
      if (width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      }
    } else if (height > maxSize) {
      width *= maxSize / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/png");

    return dataURItoBlob(dataUrl);
  };

  return new Promise((ok, no) => {
    if (!file.type.match(/image.*/)) {
      no(new Error("Not an image"));
      return;
    }

    reader.onload = (readerEvent) => {
      image.onload = () => ok(resize());
      image.src = readerEvent.target?.result as string;
    };

    reader.onerror = (err) => {
      image.onerror = () => no(err);
    };

    reader.readAsDataURL(file);
  });
};

export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const client = await getAd4mClient();

    setTimeout(() => {
      resolve("");
    }, 1000);

    try {
      const image = await client.expression.get(expUrl);
      
      if (image) {
        resolve(image.data.slice(1, -1));
      }

      resolve("")
    } catch (e) {
      console.error(e)
      resolve("");
    }
  })
}

export async function getProfile(did: string): Promise<ProfileWithDID | null> {
  const links = await getAgentLinks(did);

  const profile: Profile = {
    username: "",
    bio: "",
    email: "",
    givenName: "",
    familyName: "",
  };

  for (const link of links.filter((e) => e.data.source === FLUX_PROFILE)) {
    let expUrl;
    let image;

    switch (link.data.predicate) {
      case HAS_USERNAME:
        profile!.username = link.data.target;
        break;
      case HAS_BIO:
        profile!.bio = link.data.target;
        break;
      case HAS_GIVEN_NAME:
        profile!.givenName = link.data.target;
        break;
      case HAS_FAMILY_NAME:
        profile!.familyName = link.data.target;
        break;
      case HAS_PROFILE_IMAGE:
        expUrl = link.data.target;
        profile!.profilePicture = await getImage(expUrl);

        break;
      case HAS_THUMBNAIL_IMAGE:
        expUrl = link.data.target;
        profile!.thumbnailPicture = await getImage(expUrl);

        break;
      case HAS_BG_IMAGE:
        expUrl = link.data.target;
        profile!.profileBg = await getImage(expUrl);

        break;
      case HAS_EMAIL:
        profile!.email = link.data.target;
        break;
      default:
        break;
    }
  }

  return { ...profile, did };
}
