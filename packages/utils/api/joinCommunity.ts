import { Community } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import CommunityModel from "./community";
import { getMetaFromLinks } from "../helpers";
import { Ad4mClient } from "@perspect3vism/ad4m";
import { SubjectRepository } from "../factory";
import { Member } from "./member";

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

    const Community = new SubjectRepository(CommunityModel, {
      perspectiveUuid: perspective.uuid,
    });

    const MemberFactory = new SubjectRepository(Member, {
      perspectiveUuid: perspective.uuid,
    });

    await MemberFactory.create({ did: agent.did }, agent.did);

    const community = await Community.getData();

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
