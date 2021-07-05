import { apolloClient } from "@/app";
import { LANGUAGE } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

export async function getLanguage(language: string): Promise<ad4m.Language> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{ language: ad4m.Language }>({
        query: LANGUAGE,
        variables: { address: language },
      })
      .then((result) => {
        resolve(result.data!.language);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
