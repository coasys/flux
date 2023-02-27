import { useDataStore } from "@/store/data/index";
import { Community as CommunityModel } from "utils/api";
import { Factory } from "utils/helpers";

export interface Payload {
  communityId: string;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const community = dataStore.getCommunity(communityId);

  const Community = new Factory(CommunityModel, {
    perspectiveUuid: communityId,
  });

  const loadedCommunity = await Community.get(community.id);

  if (loadedCommunity) {
    const { name, description, image, thumbnail } = loadedCommunity;
    dataStore.updateCommunityMetadata({
      communityId,
      metadata: {
        name: await name,
        description: await description,
        image: await image,
        thumbnail: await thumbnail,
      },
    });
  }
};
