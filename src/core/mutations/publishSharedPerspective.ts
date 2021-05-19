import { apolloClient } from "@/main";
import ad4m from "@perspect3vism/ad4m-executor";
import { PUBLISH_PERSPECTIVE } from "../graphql_queries";

export function publishSharedPerspective(
  sharedPerspective: ad4m.PublishPerspectiveInput
): Promise<ad4m.SharedPerspective> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{ publishPerspective: ad4m.SharedPerspective }>({
        mutation: PUBLISH_PERSPECTIVE,
        variables: sharedPerspective,
      })
      .then((result) => {
        resolve(result.data!.publishPerspective);
      })
      .catch((error) => {
        reject(error);
      });
  });
}