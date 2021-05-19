import { apolloClient } from "@/main";
import ad4m from "@perspect3vism/ad4m-executor";
import { ADD_LINK } from "../graphql_queries";

export function createLink(
  perspective: string,
  link: ad4m.Link
): Promise<ad4m.LinkExpression> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{ addLink: ad4m.LinkExpression }>({
        mutation: ADD_LINK,
        variables: {
          perspectiveUUID: perspective,
          link: JSON.stringify(link),
        },
      })
      .then((result) => {
        resolve(result.data!.addLink);
      })
      .catch((error) => {
        reject(error);
      });
  });
}