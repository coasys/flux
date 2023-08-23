import { ref, watch, ShallowRef } from "vue";
import { SubjectRepository, getPerspectiveMeta } from "@fluxapp/api";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { Community } from "@fluxapp/api";

async function getCommunity(p: PerspectiveProxy): Promise<Community> {
  const subject = new SubjectRepository(Community, {
    perspective: p,
  });

  const community = await subject.getData();

  if (community) {
    return community;
  } else {
    try {
      const meta = await getPerspectiveMeta(p.uuid);
      return {
        // @ts-ignore
        uuid: p.uuid,
        author: meta.author || "",
        timestamp: new Date(),
        name: p.name || meta.name || "Unkown Community",
        description: meta.description || "",
        image: "",
        thumbnail: "",
        neighbourhoodUrl: p.sharedUrl!,
        id: "",
        state: p.state,
      };
    } catch (e) {
      return {
        // @ts-ignore
        uuid: p.uuid,
        author: "",
        timestamp: new Date(),
        name: p.name || "Unkown Community",
        description: "",
        image: "",
        thumbnail: "",
        neighbourhoodUrl: p.sharedUrl!,
        id: "",
        state: p.state,
      };
    }
  }
}

export function useCommunities(
  neighbourhoods: ShallowRef<{
    [x: string]: PerspectiveProxy;
  }>
) {
  let communities = ref<{ [x: string]: Community }>({});

  watch(
    neighbourhoods,
    (newNeighbourhoods) => {
      Object.keys(communities.value).forEach((uuid) => {
        const stillExist = newNeighbourhoods[uuid] ? true : false;
        if (!stillExist) {
          delete communities.value[uuid];
        }
      });

      Object.entries(newNeighbourhoods).forEach(async ([uuid, p]) => {
        p.addSyncStateChangeListener(async (state) => {
          const community = await getCommunity(p);
          communities.value = { ...communities.value, [p.uuid]: community };
        });

        const community = await getCommunity(p);
        communities.value = { ...communities.value, [p.uuid]: community };
      }, {});
    },
    { immediate: true }
  );

  return { communities };
}
