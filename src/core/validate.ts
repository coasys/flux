import type { JuntoLanguageTypes } from "./juntoTypes";

/// Should take an input bundle file, remove var DNA from bundle and then check hash of that bundle vs default installed Junto languages
export default function validateLanguage(
  bundle: string,
  languageType: JuntoLanguageTypes
): boolean {
  return true;
}
