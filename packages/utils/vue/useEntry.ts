import { watch, ref, shallowRef, triggerRef } from "vue";
import { SubjectRepository } from "utils/factory";
import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";

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
    typeof source === "function"
      ? (source as any)
      : ref(source || "ad4m://self");
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
        triggerRef(repo);

        subscribe(p, s);

        if (res) {
          entry.value = res;
        }
      }
    },
    { immediate: true }
  );

  async function fetchEntry(id: string) {
    const res = await repo.value?.getData(id);

    if (!res) return;

    entry.value = res;
  }

  async function subscribe(p: PerspectiveProxy, s: string) {
    const added = async (link: LinkExpression) => {
      const isNewEntry = link.data.source === s;
      const isUpdated = entry.value?.id === link.data.source;

      const id = isNewEntry
        ? link.data.target
        : isUpdated
        ? link.data.source
        : false;

      if (id) {
        const isInstance = await p.isSubjectInstance(id, new model());

        if (isInstance) {
          fetchEntry(id);
        }
      }

      return null;
    };

    const removed = async (link: LinkExpression) => {
      const removedEntry = link.data.source === s;
      if (removedEntry) {
        const isInstance = await p.isSubjectInstance(
          link.data.source,
          new model()
        );
        if (isInstance) {
          entry.value = null;
        }
      }
      return null;
    };

    p.addListener("link-added", added);
    p.addListener("link-removed", removed);

    return { added };
  }

  return { entry, repo };
}
