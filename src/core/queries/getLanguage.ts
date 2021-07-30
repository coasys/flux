import { apolloClient } from "@/app";
import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { LanguageHandle } from "@perspect3vism/ad4m";
import { LANGUAGE } from "../graphql_queries";

export async function getLanguage(address: string): Promise<LanguageHandle | null> {
  const { language } = unwrapApolloResult(
    await apolloClient.query({
      query: LANGUAGE,
      variables: { address },
    })
  );
  return language;
}
