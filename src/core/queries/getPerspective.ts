import { apolloClient } from "@/main";
import ad4m from "@perspect3vism/ad4m-executor";
import { PERSPECTIVE } from "../graphql_queries";

export function getPerspective(uuid: string): Promise<ad4m.Perspective> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{ perspective: ad4m.Perspective }>({
        query: PERSPECTIVE,
        variables: { uuid: uuid },
      })
      .then((result) => {
        resolve(result.data!.perspective);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
