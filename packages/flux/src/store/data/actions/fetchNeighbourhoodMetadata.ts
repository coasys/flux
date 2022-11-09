import { useDataStore } from "@/store/data/index";
import { getCommunityMetadata } from "utils/api/getCommunityMetadata";

export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  const exp = await getCommunityMetadata(communityId);

  if (exp) {
    dataStore.updateCommunityMetadata(exp);
  }
};
