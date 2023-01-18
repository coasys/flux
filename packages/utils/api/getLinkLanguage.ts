import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export default async function getLinkLanguage(): Promise<string> {
    const client = await getAd4mClient();
    const linkLanguages = await client.runtime.knownLinkLanguageTemplates();

    for (const language of linkLanguages) {
        const languageMeta = await client.languages.meta(language);
        if (languageMeta.name === "perspective-diff-sync") {
            return language;
        }
    }
    throw new Error("Did not find perspective-diff-sync language... was it published with a different name?");
}