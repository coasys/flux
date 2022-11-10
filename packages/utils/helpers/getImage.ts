import { DexieIPFS } from "../helpers/storageHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export async function fetchFromPublicGateway(url: string): Promise<string> {
    const response = await fetch(`https://ipfs.io/ipfs/${url.split("://")[1]}`);
    const json = await response.json();
    const image = json.data;
    return image;
}

//Uses the dexie store to check for cached ipfs images and if it doesn't find it, it fetches it from ad4m and saves it to the dexie store
export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    console.log("get image", expUrl);
    const client = await getAd4mClient();

    if (expUrl && expUrl !== "") {
      try {
        const timeout = setTimeout(async () => {
          const image = await fetchFromPublicGateway(expUrl);
          console.log("Got image from public ipfs gateway");
          dexie.save(expUrl, image);
          resolve(image);
        }, 3000);

        const dexie = new DexieIPFS("ipfs", 1);
        const cachedImage = await dexie.get(expUrl);
        if (cachedImage) {
          console.log("Got cached image from dexie");
          clearTimeout(timeout);
          resolve(cachedImage);
        } else {
          const expression = await client.expression.get(expUrl);
          if (expression) {
            console.log("Got image from local ipfs node");
            const image = expression.data.slice(1, -1);
            dexie.save(expUrl, image);
            clearTimeout(timeout);
            resolve(image);
          }
        }
        resolve("");
      } catch (e) {
        console.error(e);
        resolve("");
      }
    } else {
      resolve("");
    }
  });
}