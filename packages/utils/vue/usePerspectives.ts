import { ref, effect, shallowRef, triggerRef } from "vue";
import {
  Ad4mClient,
  LinkExpression,
  PerspectiveProxy,
} from "@perspect3vism/ad4m";

type UUID = string;

const perspectives = shallowRef<{ [x: UUID]: PerspectiveProxy }>({});
const onAddedLinkCbs = ref<Function[]>([]);
const onRemovedLinkCbs = ref<Function[]>([]);
const hasFetched = ref(false);

function addListeners(p: PerspectiveProxy) {
  p.addListener("link-added", (link) => {
    onAddedLinkCbs.value.forEach((cb) => {
      cb(p, link);
    });
    return null;
  });
  p.removeListener("link-removed", (link) => {
    onAddedLinkCbs.value.forEach((cb) => {
      cb(p, link);
    });
    return null;
  });
}

export function usePerspectives(client: Ad4mClient) {
  effect(async () => {
    if (hasFetched.value) return;
    // Get all perspectives
    const allPerspectives = await client.perspective.all();

    hasFetched.value = true;

    // Add each perspective to our state
    allPerspectives.forEach((p) => {
      perspectives.value[p.uuid] = p;
      triggerRef(perspectives);
      addListeners(p);
    });

    // Add new incoming perspectives
    // @ts-ignore
    client.perspective.addPerspectiveAddedListener(async (handle) => {
      const perspective = await client.perspective.byUUID(handle.uuid);
      if (perspective) {
        perspectives.value[handle.uuid] = perspective;
        addListeners(perspective);
      }
    });

    // Remove new incoming perspectives
    client.perspective.addPerspectiveRemovedListener((uuid) => {
      delete perspectives.value[uuid];
      return null;
    });
  }, {});

  function onLinkAdded(cb: Function) {
    onAddedLinkCbs.value.push(cb);
  }

  function onLinkRemoved(cb: Function) {
    onRemovedLinkCbs.value.push(cb);
  }

  return { perspectives, onLinkAdded, onLinkRemoved };
}
