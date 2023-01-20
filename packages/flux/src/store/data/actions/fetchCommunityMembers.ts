import { useDataStore } from "..";
import MemberModel from "utils/api/member";
import { useUserStore } from "@/store/user";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const userStore = useUserStore();
  
  const Member = new MemberModel({ perspectiveUuid: id });
  const members = await Member.getAll();
  const dids = members.map((m) => m.did);

  dataStore.setNeighbourhoodMembers({ members: dids.length === 0 ? [userStore.agent.did!] : dids, perspectiveUuid: id });
}
