import { Ad4mClient, LinkExpression, LanguageMeta } from '@coasys/ad4m';

export const SHORT_FORM_EXPRESSION = 'shortform-expression';

export const GROUP_EXPRESSION = 'group-expression';

export async function getLanguageMeta(client: Ad4mClient, link: LinkExpression) {
  return client.languages.meta(link.data.target);
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
