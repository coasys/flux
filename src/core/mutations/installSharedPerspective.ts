import { apolloClient } from "@/app";
import { INSTALL_SHARED_PERSPECTIVE } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

export async function installSharedPerspective(
  url: string
): Promise<ad4m.Perspective> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{
        installSharedPerspective: ad4m.Perspective;
      }>({
        mutation: INSTALL_SHARED_PERSPECTIVE,
        variables: {
          url: url,
        },
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        resolve(result.data!.installSharedPerspective);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
