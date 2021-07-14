import { apolloClient, ad4mClient } from "@/app";
import { LanguageRef } from "@perspect3vism/ad4m";

export async function createUniqueHolochainLanguage(
  languagePath: string,
  dnaNick: string,
  uid: string
): Promise<LanguageRef> {
  return ad4mClient.languages.cloneHolochainTemplate(languagePath, dnaNick, uid)
}
