import { ref, watch, ShallowRef } from "vue";
import { SubjectRepository } from "@fluxapp/api";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { Community } from "@fluxapp/api";

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
        const subject = new SubjectRepository(Community, {
          perspective: p,
        });

        const community = await subject.getData();

        console.log({ community });

        if (community) {
          communities.value = { ...communities.value, [uuid]: community };
        }
      }, {});
    },
    { immediate: true }
  );

  // communities.value =

  return { communities };
}
