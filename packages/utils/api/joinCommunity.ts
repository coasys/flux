import { getMetaFromLinks } from "../helpers/getNeighbourhoodMeta";
import { MEMBER, SELF } from "utils/constants/communityPredicates";
import { Link } from "@perspect3vism/ad4m";
import { Community } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import getCommunityMetadata from "./getCommunityMetadata";

export interface Payload {
  joiningLink: string;
}

export default async ({ joiningLink }: Payload): Promise<Community> => {
  try {
    const client = await getAd4mClient();
    const agent = await client.agent.me();
    const allPerspectives = await client.perspective.all();

    const exsistingPerspective = allPerspectives.find((perspective) => {
      perspective.sharedUrl === joiningLink;
    });

    if (exsistingPerspective) {
      throw Error("Neighbourhood already joined!");
    }

    const perspective = await client.neighbourhood.joinFromUrl(joiningLink);

    await client.perspective.addLink(perspective.uuid, {
      source: SELF,
      target: `did://${agent.did}`,
      predicate: MEMBER,
    } as Link);

    const neighbourhoodMeta = getMetaFromLinks(
      perspective.neighbourhood!.meta.links
    );

    const communityMeta = await getCommunityMetadata(perspective.uuid);

    return {
      uuid: perspective!.uuid,
      author: neighbourhoodMeta.author!,
      timestamp: neighbourhoodMeta.timestamp!,
      name: communityMeta.name || neighbourhoodMeta.name,
      description:
        communityMeta.description || neighbourhoodMeta.description || "",
      image: communityMeta.image || "",
      thumbnail: communityMeta.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did, neighbourhoodMeta.author!],
    };
  } catch (e) {
    throw new Error(e);
  }
};
