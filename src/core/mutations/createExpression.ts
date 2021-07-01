import { apolloClient } from "@/app";
import { CREATE_EXPRESSION } from "../graphql_queries";

export function createExpression(
  languageAddress: string,
  content: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{ createExpression: string }>({
        mutation: CREATE_EXPRESSION,
        variables: {
          languageAddress: languageAddress,
          content: content,
        },
      })
      .then((result) => {
        resolve(result.data!.createExpression);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
