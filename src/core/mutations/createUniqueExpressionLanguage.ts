import { apolloClient } from "@/app";
import { CREATE_UNIQUE_EXPRESSION_LANGUAGE } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

export async function createUniqueExpressionLanguage(
  languagePath: string,
  dnaNick: string,
  uid: string
): Promise<ad4m.LanguageRef> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{
        createUniqueHolochainExpressionLanguageFromTemplate: ad4m.LanguageRef;
      }>({
        mutation: CREATE_UNIQUE_EXPRESSION_LANGUAGE,
        variables: {
          languagePath: languagePath,
          dnaNick: dnaNick,
          uid: uid,
        },
      })
      .then((result) => {
        resolve(
          result.data!.createUniqueHolochainExpressionLanguageFromTemplate
        );
      })
      .catch((error) => reject(error));
  });
}
