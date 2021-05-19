import { apolloClient } from "@/main";
import { INSTALL_SHARED_PERSPECTIVE } from "../graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";

export async function installSharedPerspective(
  url: string
): Promise<ad4m.Perspective> {
  return new Promise((resolve) => {
    const install = apolloClient.mutate<{
      installSharedPerspective: ad4m.Perspective;
    }>({
      mutation: INSTALL_SHARED_PERSPECTIVE,
      variables: {
        url: url,
      },
    });
    install.then((result) => {
      resolve(result.data!.installSharedPerspective);
    });
  });
}
