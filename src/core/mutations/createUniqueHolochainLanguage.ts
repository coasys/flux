import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { LanguageRef } from "@perspect3vism/ad4m";
import { LANGUAGE_CLONE_HOLOCHAIN_TEMPLATE } from "../graphql_queries";

export async function createUniqueHolochainLanguage(
  languagePath: string,
  dnaNick: string,
  uid: string
): Promise<LanguageRef> {
  const { languageCloneHolochainTemplate } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: LANGUAGE_CLONE_HOLOCHAIN_TEMPLATE,
      variables: { languagePath, dnaNick, uid },
    })
  );

  return languageCloneHolochainTemplate;
}
