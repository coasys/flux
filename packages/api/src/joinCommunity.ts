import { Community } from "@fluxapp/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { getMetaFromLinks } from "@fluxapp/utils";
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
      
    await client.perspective.update(perspective.uuid, neighbourhoodMeta.name);

    return {
      uuid: perspective!.uuid,
      author: neighbourhoodMeta.author!,
      timestamp: neighbourhoodMeta.timestamp!,
      name: neighbourhoodMeta.name,
      description: neighbourhoodMeta.description || "",
      image: "",
      thumbnail: "",
      neighbourhoodUrl: perspective.sharedUrl!,
      members: [agent.did],
      id: "",
    };
  } catch (e) {
    throw new Error(e);
  }
};
