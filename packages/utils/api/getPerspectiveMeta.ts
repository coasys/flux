import { findLink } from "../helpers/linkHelpers";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import ad4mClient from "./client";

export default async function getPerspectiveMeta(uuid: string) {
  const perspective = await ad4mClient.perspective.byUUID(uuid);
  
  if (!perspective || !perspective.neighbourhood) {
    throw new Error("Could not load meta data from perspective");
  }
  
  const neighbourhood = perspective.neighbourhood;

  const links = (neighbourhood.meta?.links as Array<any>) || [];
  const languageLinks = links.filter(findLink.language);
  const langs = await getMetaFromLinks(languageLinks);
  
  return {
    name: links.find(findLink.name).data.target,
    description: links.find(findLink.description)?.data?.target,
    languages: keyedLanguages(langs),
    url: perspective?.sharedUrl || "",
    dateCreated: links.find(findLink.dateCreated).data.target,
    sourceUrl: perspective?.sharedUrl,
  };
}
