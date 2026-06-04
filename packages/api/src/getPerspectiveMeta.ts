import { Ad4mClient, LinkExpression } from '@coasys/ad4m';
import { findLink, keyedLanguages } from '@coasys/flux-utils';

export default async function getPerspectiveMeta(client: Ad4mClient, uuid: string) {
  const perspective = await client.perspective.byUUID(uuid);

  if (!perspective || !perspective.neighbourhood) {
    throw new Error('Could not load meta data from perspective');
  }

  const neighbourhood = perspective.neighbourhood.data;

  const links: LinkExpression[] = (neighbourhood.meta?.links) || [];
  const languageMetas = await Promise.all(
    links.filter(findLink.language).map((link) => client.languages.meta(link.data.target)),
  );

  return {
    name: links.find(findLink.name)?.data?.target ?? '',
    description: links.find(findLink.description)?.data?.target,
    languages: keyedLanguages(languageMetas),
    url: perspective?.sharedUrl || '',
    dateCreated: links.find(findLink.dateCreated)?.data?.target ?? '',
    sourceUrl: perspective?.sharedUrl,
  };
}
