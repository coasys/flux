import { useDataStore } from "..";
import { Factory } from "utils/helpers";
import { Member as MemberModel } from "utils/api";
import { useUserStore } from "@/store/user";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const userStore = useUserStore();

  const Member = new Factory(MemberModel, { perspectiveUuid: id });
  const members = await Member.getAll();
  const dids = members.map((m) => m.did);

  dataStore.setNeighbourhoodMembers({
    members: dids.length === 0 ? [userStore.agent.did!] : dids,
    perspectiveUuid: id,
  });
}
