import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { ExpressionString } from "@perspect3vism/ad4m-types";
import { EXPRESSION_SIGN } from "../graphql_queries";

export async function expressionSign(data: any): Promise<ExpressionString> {
  const { expressionSign } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: EXPRESSION_SIGN,
      variables: { data },
    })
  );
  return expressionSign;
}
