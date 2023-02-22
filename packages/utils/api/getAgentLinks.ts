import { LinkExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { useUserStore } from "@/store/user";

export default async function getAgentLinks(
  did: string
): Promise<LinkExpression[]> {
  const userStore = useUserStore();

  const client = await getAd4mClient();

  let links: LinkExpression[] = [];

  if (userStore.getUser?.agent.did === did) {
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
