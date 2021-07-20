import { ApolloQueryResult, FetchResult } from "@apollo/client";

export default function unwrapApolloResult(
  result: ApolloQueryResult<any> | FetchResult<any>
) {
  console.debug("GQL result:", result);
  //@ts-ignore
  if (result.error) {
    //@ts-ignore
    throw result.error.message;
  }
  if (result.errors) {
    throw result.errors;
  }
  return result.data;
}
