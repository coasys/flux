import { getMetaFromLinks } from "../helpers/getNeighbourhoodMeta";
import { MEMBER, SELF } from "utils/constants/communityPredicates";
import { Link } from "@perspect3vism/ad4m";
import { Community } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import getCommunityMetadata from "./getCommunityMetadata";
import MemberModel from "./member";
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
      timestamp: new Date(community.timestamp),
      name: communityMeta.name || community.name,
      description: communityMeta.description || community.description || "",
      image: communityMeta.image || "",
      thumbnail: communityMeta.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did, community.author!],
    };
  } catch (e) {
    throw new Error(e);
  }
};
