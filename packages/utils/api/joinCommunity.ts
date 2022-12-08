import { Community } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import CommunityModel from "./community";

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

    const Community = new CommunityModel({ perspectiveUuid: perspective.uuid });

    await Community.addMember({ did: agent.did });

    const community = await Community.get();

    return {
      uuid: perspective!.uuid,
      author: community.author!,
      timestamp: community.timestamp.toString(),
      name: community.name,
      description: community.description || "",
      image: community.image || "",
      thumbnail: community.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did, community.author!],
    };
  } catch (e) {
    throw new Error(e);
  }
};
