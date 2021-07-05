import { apolloClient } from "@/app";
import { QUERY_EXPRESSION } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import sleep from "@/utils/sleep";

//Query expression handler
export function getExpression(url: string): Promise<ad4m.Expression> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{
        expression: ad4m.Expression;
      }>({ query: QUERY_EXPRESSION, variables: { url: url } })
      .then((result) => {
        resolve(result.data.expression);
      })
      .catch((error) => reject(error));
  });
}

export function getExpressionNoCache(url: string): Promise<ad4m.Expression> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{
        expression: ad4m.Expression;
      }>({
        query: QUERY_EXPRESSION,
        variables: { url: url },
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        resolve(result.data.expression);
      })
      .catch((error) => reject(error));
  });
}

export async function getExpressionAndRetry(
  url: string,
  retries: number,
  retryDelay: number
): Promise<ad4m.Expression | null> {
  let getExprRes = await getExpressionNoCache(url);
  if (getExprRes == null) {
    for (let i = 0; i < retries; i++) {
      //console.log("Retrying get of expression in getExpressionAndRetry");
      getExprRes = await getExpressionNoCache(url);
      if (getExprRes != null) {
        break;
      }
      await sleep(retryDelay * i);
    }
    if (getExprRes == null) {
      throw Error(`Could not get expression in ${retries} retries`);
    }
  }
  return getExprRes;
}
