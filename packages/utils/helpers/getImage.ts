import { DexieIPFS } from "../helpers/storageHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

//Uses the dexie store to check for cached ipfs images and if it doesn't find it, it fetches it from ad4m and saves it to the dexie store
export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    console.log("get image", expUrl);
    const client = await getAd4mClient();

    if (expUrl && expUrl !== "") {
      try {
        setTimeout(() => {
          resolve("");
        }, 1000);

        const dexie = new DexieIPFS("ipfs", 1);
        const cachedImage = await dexie.get(expUrl);
        if (cachedImage) {
          console.log("Got cached image from dexie");
          resolve(cachedImage);
        } else {
          const expression = await client.expression.get(expUrl);
          if (expression) {
            const image = expression.data.slice(1, -1);
            dexie.save(expUrl, image);
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