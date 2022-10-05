import { LinkExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export default async function getAgentLinks(
  did: string,
  userPerspective?: string
): Promise<LinkExpression[]> {
  const client = await getAd4mClient();

  let links: LinkExpression[] = [];

  if (userPerspective) {
    // @ts-ignore
    const { links: areaLinks } = await client.perspective.snapshotByUUID(
      userPerspective!
    );

    links = areaLinks;
  } else {
    // @ts-ignore
    const agentPerspective = await client.agent.byDID(did);

    if (agentPerspective) {
      links = agentPerspective!.perspective!.links;
    } else {
      links = [];
    }
  }

  return links;
}
