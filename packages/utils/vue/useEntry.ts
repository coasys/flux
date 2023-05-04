import { watch, ref, shallowRef } from "vue";
import { SubjectRepository } from "utils/factory";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

export function useEntry<SubjectClass>({
  perspective,
  source,
  id,
  model,
}: {
  perspective: PerspectiveProxy | Function;
  id?: string | Function;
  source?: string | Function;
  model: SubjectClass;
}) {
  const idRef = typeof id === "function" ? (id as any) : ref(id);
  const sourceRef =
    typeof source === "function" ? (source as any) : ref(source);
  const perspectiveRef =
    typeof perspective === "function" ? (perspective as any) : perspective;

  let entry = ref<Record<string, any> | null>(null);
  let repo = shallowRef<SubjectRepository<any> | null>(null);

  watch(
    [perspectiveRef, sourceRef, idRef],
    async ([p, s, id]) => {
      if (p?.uuid) {
        const r = new SubjectRepository(model, {
          perspective: p,
          source: s,
        });

        const res = await r.getData(id);
        repo.value = r;
        if (res) {
          entry.value = res;
        }
      }
    },
    { immediate: true }
  );

  return { entry, repo };
}
