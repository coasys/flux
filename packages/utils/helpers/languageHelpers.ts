import { LinkExpression, LanguageMeta } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";
import ad4mClient from "../api/client";

export const SHORT_FORM_EXPRESSION = "shortform-expression";

export const GROUP_EXPRESSION = "group-expression";

export async function getLanguageMeta(link: LinkExpression) {
  const client = await getAd4mClient();

  return client.languages.meta(link.data.target);
}

export function getMetaFromLinks(links: LinkExpression[]) {
  const langs = links.map((link) => getLanguageMeta(link));
  return Promise.all(langs);
}

export function keyedLanguages(languages: LanguageMeta[]) {
  return languages.reduce((acc, lang) => {
    let langName: string = lang.templateSourceLanguageAddress;

    if (lang.name.endsWith(SHORT_FORM_EXPRESSION)) {
      langName = SHORT_FORM_EXPRESSION;
    } else if (lang.name.endsWith(GROUP_EXPRESSION)) {
      langName = GROUP_EXPRESSION;
    }

    return {
      ...acc,
      // TODO: Security problem, someone could call lang the same name
      [langName]: lang.address,
    };
  }, {});
}
