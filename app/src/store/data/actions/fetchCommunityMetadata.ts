import { useDataStore } from "@/store/data/index";
import { Community as CommunityModel } from "utils/api";
import { SubjectRepository } from "utils/factory";

export interface Payload {
  communityId: string;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const community = dataStore.getCommunity(communityId);

  const Community = new SubjectRepository(CommunityModel, {
    perspectiveUuid: communityId,
  });

  const loadedCommunity = await Community.getData(community.id);

  if (loadedCommunity) {
    const { name, description, image, thumbnail } = loadedCommunity;
    dataStore.updateCommunityMetadata({
      communityId,
      metadata: {
        name,
        description,
        image,
        thumbnail,
        id: community.id
      },
    });
  }
};
