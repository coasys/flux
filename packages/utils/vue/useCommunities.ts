import { ref, effect, watch, ShallowRef } from "vue";
import { SubjectRepository } from "utils/factory";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { Community } from "../api";

export function useCommunities(
  perspectives: ShallowRef<{
    [x: string]: PerspectiveProxy;
  }>
) {
  let communities = ref<{ [x: string]: Community }>({});

  watch(
    perspectives,
    (newPers) => {
      Object.keys(communities.value).forEach((uuid) => {
        const stillExist = newPers[uuid] ? true : false;
        if (!stillExist) {
          delete communities.value[uuid];
        }
      });

      Object.keys(newPers).forEach(async (uuid) => {
        const subject = new SubjectRepository(Community, {
          perspectiveUuid: uuid,
        });
        const community = await subject.getData();
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
