import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { mapLiteralLinks } from "@coasys/flux-utils";
import { profile } from "@coasys/flux-constants";
import { WebLink } from "@coasys/flux-types";

const { OG_DESCRIPTION, OG_TITLE, OG_IMAGE, AREA_WEBLINK, OG_LINK } = profile;

export default async function getAgentWebLinks(
  did: string
): Promise<WebLink[]> {
  const client = await getAd4mClient();

  const agent = await client.agent.byDID(did);

  if (!agent?.perspective) return [];

  const webLinkAreas = agent.perspective.links.filter(
    (l: LinkExpression) => l.data.predicate === AREA_WEBLINK
  );

  const webLinks = webLinkAreas.map((parentLink: any) => {
    const associatedLinks = agent.perspective.links.filter(
      (link: LinkExpression) => link.data.source === parentLink.data.target
    );

    const ogData = mapLiteralLinks(associatedLinks, {
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      image: OG_IMAGE,
      url: OG_LINK,
    });

    return {
      ...ogData,
      url: Literal.fromUrl(parentLink.data.target).get().data,
      id: parentLink.data.target,
    };
  });

  return webLinks;
}
