import { DexieIPFS } from "../helpers/storageHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";

export function fetchFromPublicGateway(url: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve("");
    }, 1000);
    const response = await fetch(
      `https://gateway.ipfs.io/ipfs/${url.split("://")[1]}`
    );
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
        let timeout = null;

        function startTimeout() {
          timeout = setTimeout(async () => {
            const image = await fetchFromPublicGateway(expUrl);
            dexie.save(expUrl, image);
            resolve(image);
          }, 5000);
        }

        const dexie = new DexieIPFS("ipfs");
        const cachedImage = await dexie.get(expUrl);

        if (cachedImage === null || cachedImage === undefined) {
          startTimeout();
          const expression = await client.expression.get(expUrl);
          console.log({ expression });
          if (expression) {
            const image = expression.data.slice(1, -1);
            dexie.save(expUrl, image);
            timeout && clearTimeout(timeout);
            resolve(image);
          }
        } else {
          timeout && clearTimeout(timeout);
          resolve(cachedImage);
        }
        resolve(undefined);
      } catch (e) {
        resolve(undefined);
      }
    } else {
      resolve(undefined);
    }
  });
}
