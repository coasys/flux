import { ad4mClient } from "@/app";
import { LinkExpression } from "@perspect3vism/ad4m";

export default async function getAgentLinks(
  did: string,
  userPerspective?: string
): Promise<LinkExpression[]> {
  let links: LinkExpression[] = [];

  if (userPerspective) {
    // @ts-ignore
    const { links: areaLinks } = await ad4mClient.perspective.snapshotByUUID(
      userPerspective!
    );

    links = areaLinks;
  } else {
    // @ts-ignore
    const agentPerspective = await ad4mClient.agent.byDID(did);

    const agentLinks = agentPerspective!.perspective!.links;

    links = agentLinks;
  }

  return links;
}
