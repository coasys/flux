import { useDataStore } from "@/store/data/index";
import { getGroupMetadata } from "utils/helpers/getMetaFromNeighbourhood";

export interface Payload {
  communityId: string;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const metadata = await getGroupMetadata(communityId);

  if (metadata) {
    dataStore.updateCommunityMetadata({ communityId, metadata });
  }
};
