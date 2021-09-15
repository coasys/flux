import { apolloClient } from "@/utils/setupApolloClient";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { LanguageRef } from "@perspect3vism/ad4m";
import { LANGUAGE_APPLY_TEMPLATE_AND_PUBLISH } from "../graphql_queries";

export async function templateLanguage(
  languageHash: string,
  templateData: string
): Promise<LanguageRef> {
  const { languageApplyTemplateAndPublish } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: LANGUAGE_APPLY_TEMPLATE_AND_PUBLISH,
      variables: { languageHash, templateData },
    })
  );

  return languageApplyTemplateAndPublish;
}
