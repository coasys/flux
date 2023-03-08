import { DexieIPFS } from "../helpers/storageHelpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { cacheImage } from "./cacheImage";
import { FILE_STORAGE_LANGUAGE } from "../constants/languages";

//Uses the dexie store to check for cached ipfs images and if it doesn't find it, it fetches it from ad4m and saves it to the dexie store
export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const client = await getAd4mClient();

    if (expUrl && expUrl !== "") {
      try {
        const dexie = new DexieIPFS("ipfs");
        //const cachedImage = await dexie.get(expUrl);
        const cachedImage = null;

        if (cachedImage === null || cachedImage === undefined) {
          const expression = await client.expression.get(expUrl);

          if (
            expression &&
            expression.language.address === FILE_STORAGE_LANGUAGE
          ) {
            try {
              const base64 = JSON.parse(expression.data).data_base64;
              const correct = `data:image/png;base64,${base64}`;

              dexie.save(expUrl, correct);
              resolve(correct);
            } catch (e) {
              resolve("");
            }
          }
          resolve("");
        }
      } catch (e) {
        resolve("");
      }
    } else {
      resolve("");
    }
  });
}
