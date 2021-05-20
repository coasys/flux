import { apolloClient } from "@/main";
import { QUERY_EXPRESSION } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

//Query expression handler
export function getExpression(url: string): Promise<ad4m.Expression> {
  return new Promise((resolve) => {
    const getExpression = apolloClient.query<{
      expression: ad4m.Expression;
    }>({ query: QUERY_EXPRESSION, variables: { url: url } });
    getExpression.then((result) => {
      resolve(result.data.expression);
    });
  });
}
