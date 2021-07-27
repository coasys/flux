import { ApolloQueryResult, FetchResult } from "@apollo/client";

export default function unwrapApolloResult(
  result: ApolloQueryResult<any> | FetchResult<any>
) {
  // console.log("GQL result:", result);
  //@ts-ignore
  if (result.error) {
    //@ts-ignore
    throw Error(result.error.message);
  }
  if (result.errors) {
    throw Error(result.errors.map((error) => error.message).toString());
  }
  return result.data;
}
