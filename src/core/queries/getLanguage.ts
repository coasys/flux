import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { LanguageHandle } from "@perspect3vism/ad4m/lib/language/LanguageHandle";
import { LANGUAGE } from "../graphql_queries";

export async function getLanguage(language: string): Promise<LanguageHandle> {
  const { languages } = unwrapApolloResult(await apolloClient.query({
    query: LANGUAGE,
    variables: { filter: language }
}))
return languages
}
