import { ref, shallowRef, watch } from "vue";
import { SubjectRepository } from "utils/factory";
import { PerspectiveProxy, LinkExpression } from "@perspect3vism/ad4m";

export function useEntries<SubjectClass>({
  perspective,
  source,
  model,
}: {
  perspective: PerspectiveProxy | Function;
  source: string | Function;
  model: SubjectClass;
}) {
  const sourceRef =
    typeof source === "function" ? (source as any) : ref(source);
  const perspectiveRef =
    typeof perspective === "function" ? (perspective as any) : ref(perspective);

  let entries = ref<{ [x: string]: any }[]>([]);
  let repo: SubjectRepository<any> | null = null;

  watch(
    [perspectiveRef, sourceRef],
    ([p, s]) => {
      if (p?.uuid) {
        const rep = new SubjectRepository(model, {
          perspective: p,
          source: s,
        });

        rep.getAllData(s).then((res) => {
          entries.value = res;
        });

        repo = rep;

        subscribe(p, s);
      }
    },
    { immediate: true }
  );

  async function fetchEntry(id: string) {
    const entry = await repo?.getData(id);

    if (!entry) return;

    const isUpdatedEntry = entries.value.find((e) => e.id === entry.id);

    if (isUpdatedEntry) {
      entries.value = entries.value.map((e) => {
        const isTheUpdatedOne = e.id === isUpdatedEntry.id;
        return isTheUpdatedOne ? entry : e;
      });
    } else {
      entries.value.push(entry);
    }
  }

  async function subscribe(p: PerspectiveProxy, s: string) {
    const added = (link: LinkExpression) => {
      const isNewEntry = link.data.source === s;
      const isUpdated = entries.value.find((e) => e.id === link.data.source);

      if (isUpdated) {
        console.log("updated", link);
        fetchEntry(link.data.source);
      }

      if (isNewEntry) {
        p.getSubjectProxy(link.data.target, model).then((res) => {
          console.log("new entry", link, res);
          fetchEntry(link.data.target);
        });
      }

      return null;
    };

    const removed = (link: LinkExpression) => {
      const removedEntry = link.data.source === s;
      if (removedEntry) {
        entries.value = entries.value.filter((e) => e.id !== link.data.target);
      }
      return null;
    };

    p.addListener("link-added", added);
    p.addListener("link-removed", removed);

    return { added };
  }

  return { entries, repo };
}
