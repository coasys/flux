import { apolloClient } from "@/app";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import type { LanguageRef } from "@perspect3vism/ad4m";
import { LANGUAGE_APPLY_TEMPLATE_AND_PUBLISH } from "../graphql_queries";

export async function templateLanguage(
  sourceLanguageHash: string,
  templateData: string
): Promise<LanguageRef> {
  const { languageApplyTemplateAndPublish } = unwrapApolloResult(
    await apolloClient.mutate({
      mutation: LANGUAGE_APPLY_TEMPLATE_AND_PUBLISH,
      variables: { sourceLanguageHash, templateData },
    })
  );

  return languageApplyTemplateAndPublish;
}
