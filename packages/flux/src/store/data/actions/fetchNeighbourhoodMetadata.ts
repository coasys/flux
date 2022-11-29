import { useDataStore } from "@/store/data/index";
import getCommunityMetaData from "utils/api/getCommunityMetadata";

export interface Payload {
  communityId: string;
}

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const metadata = await getCommunityMetaData(communityId);

  if (metadata) {
    dataStore.updateCommunityMetadata({ communityId, metadata });
  }
};
