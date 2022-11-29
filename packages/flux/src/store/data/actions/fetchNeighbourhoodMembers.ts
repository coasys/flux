import { useDataStore } from "..";
import { fetchMemberDids } from "utils/api/getMembers";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const dids = await fetchMemberDids(id);

  dataStore.setNeighbourhoodMembers({ members: dids, perspectiveUuid: id });
}
