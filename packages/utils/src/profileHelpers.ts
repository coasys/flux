import { LinkExpression } from "@coasys/ad4m";
import { profile } from "@coasys/flux-constants";
import { mapLiteralLinks } from "./linkHelpers";
import { Profile } from "@coasys/flux-types";

const {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profile;

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
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64 as string);
    };
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
};

// Resizes the image by creating a canvas and resizing it to the resized image
export const resizeImage = (
  file: any,
  percentage: number,
  maxSize = 80
): Promise<Blob> => {
  const reader = new FileReader();
  const image = new Image();
  const canvas = document.createElement("canvas");

  const resize = () => {
    let { width, height } = image;

    if (width <= maxSize || height <= maxSize) {
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }
    } else {
      height = height * percentage;
      width = width * percentage;
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

export const profileFormatter = (links: LinkExpression[]): Profile => {
  return mapLiteralLinks(
    links.filter((e) => e.data.source === FLUX_PROFILE),
    {
      username: HAS_USERNAME,
      bio: HAS_BIO,
      givenName: HAS_GIVEN_NAME,
      email: HAS_EMAIL,
      familyName: HAS_FAMILY_NAME,
      profilePicture: HAS_PROFILE_IMAGE,
      profileThumbnailPicture: HAS_THUMBNAIL_IMAGE,
      profileBackground: HAS_BG_IMAGE,
    }
  ) as Profile;
}