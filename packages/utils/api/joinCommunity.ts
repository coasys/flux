import {
  getMetaFromNeighbourhood,
  getGroupMetadata,
} from "../helpers/getMetaFromNeighbourhood";
import { MEMBER, SELF } from "utils/constants/communityPredicates";
import { Link } from "@perspect3vism/ad4m";
import { Community } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

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

    const { name, description, author, timestamp } =
      getMetaFromNeighbourhood(perspective.neighbourhood!.meta.links);
    const groupExp = await getGroupMetadata(perspective.uuid);

    return {
      uuid: perspective!.uuid,
      author: author,
      timestamp: timestamp,
      name: name,
      description: description || "",
      image: groupExp.image || "",
      thumbnail: groupExp.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did, author],
    };
  } catch (e) {
    throw new Error(e);
  }
};
