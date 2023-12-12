import { LinkExpression } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";

export default async function getAgentLinks(
  did: string
): Promise<LinkExpression[]> {
  const client = await getAd4mClient();
  const me = await client.agent.me();

  let links: LinkExpression[] = [];

  if (me.did === did) {
    const me = await client.agent.me();
    if (me.perspective) {
      links = me.perspective.links;
    } else {
      throw new Error("Could not find public perspective for agent self");
    }
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
