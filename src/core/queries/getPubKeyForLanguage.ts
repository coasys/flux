import { apolloClient } from "@/main";
import { PUB_KEY_FOR_LANG } from "../graphql_queries";

export function getPubKeyForLanguage(lang: string): Promise<string> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{ pubKeyForLanguage: string }>({
        query: PUB_KEY_FOR_LANG,
        variables: { lang: lang },
      })
      .then((result) => {
        resolve(result.data!.pubKeyForLanguage);
      })
      .catch((error) => reject(error));
  });
}