import { useDataStore } from "@/store/data/index";
import { Community as CommunityModel } from "utils/api";
import { Factory } from "utils/helpers";

export interface Payload {
  communityId: string;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const Community = new Factory(new CommunityModel(), {
    perspectiveUuid: communityId,
  });

  const community = await Community.get();

  if (community) {
    const { name, description, image, thumbnail } = community;
    dataStore.updateCommunityMetadata({
      communityId,
      metadata: {
        name,
        description,
        image,
        thumbnail,
      },
    });
  }
};
