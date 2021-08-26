import { createExpression } from "@/core/mutations/createExpression";
import { Profile } from "@/store/types";

import {
  ACCOUNT_NAME,
  GIVEN_NAME,
  FAMILY_NAME,
  EMAIL,
  TYPE as PROFILETYPE,
} from "@/constants/profile";
import {
  IMAGE,
  CONTENT_URL,
  CONTENT_SIZE,
  TYPE as IMAGETYPE,
  THUMBNAIL,
} from "@/constants/image";

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

export async function createProfile(
  expressionLanguage: string,
  profileData: Profile
): Promise<string> {
  try {
    const profile: { [x: string]: any } = {
      [ACCOUNT_NAME]: profileData.username,
      [EMAIL]: profileData.email,
      [GIVEN_NAME]: profileData.givenName,
      [FAMILY_NAME]: profileData.familyName,
      // TODO: Is type also a const?
      "@type": [PROFILETYPE],
    };

    if (profileData.profilePicture && profileData.thumbnailPicture) {
      profile[IMAGE] = JSON.stringify({
        "@type": IMAGETYPE,
        [CONTENT_SIZE]: byteSize(profileData.profilePicture),
        [CONTENT_URL]: profileData.profilePicture,
        [THUMBNAIL]: {
          "@type": IMAGETYPE,
          [CONTENT_SIZE]: byteSize(profileData.thumbnailPicture),
          [CONTENT_URL]: profileData.thumbnailPicture,
        },
      });
    }

    const createProfileExpression = await createExpression(
      expressionLanguage,
      JSON.stringify({
        "@context": {
          foaf: "http://xmlns.com/foaf/0.1/",
          schema: "https://schema.org/",
        },
        profile,
        signed_agent: "NA",
      })
    );
    console.log(
      "Created profile expression with result",
      createProfileExpression
    );

    return createProfileExpression;
  } catch (error) {
    throw Error(error);
  }
}
