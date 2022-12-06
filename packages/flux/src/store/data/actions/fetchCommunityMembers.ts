import { useDataStore } from "..";
import MemberModel from "utils/api/member";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();

  const Member = new MemberModel({ perspectiveUuid: id });
  const members = await Member.getAll();
  const dids = members.map((m) => m.did);

  dataStore.setNeighbourhoodMembers({ members: dids, perspectiveUuid: id });
}
