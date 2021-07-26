import { createExpression } from "@/core/mutations/createExpression";
import { Profile } from "@/store/types";

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
      "foaf:AccountName": profileData.username,
      "schema:email": profileData.email,
      "schema:givenName": profileData.givenName,
      "schema:familyName": profileData.familyName,
      "@type": "foaf:OnlineAccount",
    };

    if (profileData.profilePicture && profileData.thumbnailPicture) {
      profile["schema:image"] = JSON.stringify({
        "@type": "schema:ImageObject",
        "schema:contentSize": byteSize(profileData.profilePicture),
        "schema:contentUrl": profileData.profilePicture,
        "schema:thumbnail": {
          "@type": "schema:ImageObject",
          "schema:contentSize": byteSize(profileData.thumbnailPicture),
          "schema:contentUrl": profileData.thumbnailPicture,
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
    throw new Error(error);
  }
}
