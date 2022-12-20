import { DexieIPFS } from "../helpers/storageHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export function fetchFromPublicGateway(url: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve("");
    }, 1000);
    const response = await fetch(`https://cloudflare-ipfs.com/ipfs/${url.split("://")[1]}`);
    const json = await response.json();
    const image = json.data;
    clearTimeout(timeout);
    resolve(image);
  });
}

//Uses the dexie store to check for cached ipfs images and if it doesn't find it, it fetches it from ad4m and saves it to the dexie store
export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const client = await getAd4mClient();

    if (expUrl && expUrl !== "") {
      try {
        const timeout = setTimeout(async () => {
          const image = await fetchFromPublicGateway(expUrl);
          dexie.save(expUrl, image);
          resolve(image);
        }, 5000);

        const dexie = new DexieIPFS("ipfs");
        const cachedImage = await dexie.get(expUrl);
        if (cachedImage) {
          clearTimeout(timeout);
          resolve(cachedImage);
        } else {
          const expression = await client.expression.get(expUrl);
          if (expression) {
            const image = expression.data.slice(1, -1);
            dexie.save(expUrl, image);
            clearTimeout(timeout);
            resolve(image);
          }
        }
        resolve("");
      } catch (e) {
        resolve("");
      }
    } else {
      resolve("");
    }
  });
}
