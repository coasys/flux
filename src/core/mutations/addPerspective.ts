import { apolloClient } from "@/app";
import ad4m from "@perspect3vism/ad4m-executor";
import { ADD_PERSPECTIVE } from "../graphql_queries";

export function addPerspective(name: string): Promise<ad4m.Perspective> {
  return new Promise((resolve, reject) => {
    apolloClient
      .mutate<{
        addPerspective: ad4m.Perspective;
      }>({ mutation: ADD_PERSPECTIVE, variables: { name: name } })
      .then((result) => {
        resolve(result.data!.addPerspective);
      })
      .catch((error) => reject(error));
  });
}
