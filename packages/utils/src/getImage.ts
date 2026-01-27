import { Ad4mClient } from '@coasys/ad4m';
import { languages } from '@coasys/flux-constants';
const { FILE_STORAGE_LANGUAGE } = languages;

export async function getImage(client: Ad4mClient, expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (expUrl) {
      try {
        const expression = await client.expression.get(expUrl);

        if (expression && expression.language.address === FILE_STORAGE_LANGUAGE) {
          const base64 = await JSON.parse(expression.data).data_base64;
          const correct = `data:image/png;base64,${base64}`;

          resolve(correct);
        }
      } catch (e) {
        resolve('');
      }
    }

    resolve('');
  });
}
