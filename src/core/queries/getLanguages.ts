import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { LanguageHandle } from "@perspect3vism/ad4m-types";
import { LANGUAGES } from "../graphql_queries";

export async function getLanguages(): Promise<LanguageHandle[]> {
  const { languages } = unwrapApolloResult(
    await apolloClient.query({
      query: LANGUAGES,
      variables: { filter: "" },
    })
  );
  return languages;
}
