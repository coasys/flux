import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { languages } from "@fluxapp/constants";
const { FILE_STORAGE_LANGUAGE } = languages;

//Uses the dexie store to check for cached ipfs images and if it doesn't find it, it fetches it from ad4m and saves it to the dexie store
export async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (expUrl) {
      try {
        const client = await getAd4mClient();
        const expression = await client.expression.get(expUrl);

        if (
          expression &&
          expression.language.address === FILE_STORAGE_LANGUAGE
        ) {
          const base64 = await JSON.parse(expression.data).data_base64;
          const correct = `data:image/png;base64,${base64}`;

          resolve(correct);
        }
      } catch (e) {
        resolve("");
      }
    }

    resolve("");
  });
}
