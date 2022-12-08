import { useDataStore } from "@/store/data/index";
import CommunityModel from "utils/api/community";

export interface Payload {
  communityId: string;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const Community = new CommunityModel({ perspectiveUuid: communityId });

  const { name, description, image, thumbnail } = await Community.get();

  dataStore.updateCommunityMetadata({
    communityId,
    metadata: {
      name,
      description,
      image,
      thumbnail,
    },
  });
};
