import { Community } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import CommunityModel from "./community";
import { getMetaFromLinks } from "utils/helpers/getNeighbourhoodMeta";
import { Ad4mClient } from "@perspect3vism/ad4m";

export interface Payload {
  joiningLink: string;
}

export default async ({ joiningLink }: Payload): Promise<Community> => {
  try {
    const client: Ad4mClient = await getAd4mClient();
    const agent = await client.agent.me();
    const allPerspectives = await client.perspective.all();

    const exsistingPerspective = allPerspectives.find((perspective) => {
      perspective.sharedUrl === joiningLink;
    });

    if (exsistingPerspective) {
      throw Error("Neighbourhood already joined!");
    }

    const perspective = await client.neighbourhood.joinFromUrl(joiningLink);

    const neighbourhoodMeta = getMetaFromLinks(
      perspective.neighbourhood!.meta.links
    );

    const Community = new CommunityModel({ perspectiveUuid: perspective.uuid });

    await Community.addMember({ did: agent.did });

    const community = await Community.get();

    return {
      uuid: perspective!.uuid,
      author: neighbourhoodMeta.author!,
      timestamp: neighbourhoodMeta.timestamp!,
      name: community?.name || neighbourhoodMeta.name,
      description:
        community?.description || neighbourhoodMeta.description || "",
      image: community?.image || "",
      thumbnail: community?.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did],
    };
  } catch (e) {
    throw new Error(e);
  }
};
