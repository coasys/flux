import { ref, effect } from "vue";
import { SubjectRepository } from "utils/factory";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { Community } from "../api";

export function useCommunities<SubjectClass>(perspectives: {
  [x: string]: PerspectiveProxy;
}) {
  let communities = ref<{ [x: string]: Community }>({});

  effect(() => {
    Object.keys(perspectives.value).forEach(async (uuid) => {
      const subject = new SubjectRepository(Community, {
        perspectiveUuid: uuid,
      });
      const community = await subject.getData();
      if (community) {
        communities.value[uuid] = community;
      }
    });
  });

  return { communities };
}
