import { apolloClient } from "@/app";
import { LANGUAGES } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

export async function getLanguages(): Promise<ad4m.Language[]> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{ languages: ad4m.Language[] }>({
        query: LANGUAGES,
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        resolve(result.data!.languages);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
