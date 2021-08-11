import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { CREATE_EXPRESSION } from "../graphql_queries";

export async function createExpression(
  languageAddress: string,
  content: string
): Promise<string> {
  const { expressionCreate } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: CREATE_EXPRESSION,
      variables: { content, languageAddress },
    })
  );
  return expressionCreate;
}
