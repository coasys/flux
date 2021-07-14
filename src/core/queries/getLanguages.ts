import { ad4mClient } from "@/app";
import { LanguageHandle } from "@perspect3vism/ad4m/lib/language/LanguageHandle";

export async function getLanguages(): Promise<LanguageHandle[]> {
  return ad4mClient.languages.all()
}
