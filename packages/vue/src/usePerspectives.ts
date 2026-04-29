import { ref, effect, shallowRef, watch, triggerRef } from 'vue';
import { Ad4mClient, PerspectiveProxy } from '@coasys/ad4m';

type UUID = string;

const perspectives = shallowRef<{ [x: UUID]: PerspectiveProxy }>({});
const neighbourhoods = shallowRef<{ [x: UUID]: PerspectiveProxy }>({});
const onAddedLinkCbs = ref<Function[]>([]);
const onRemovedLinkCbs = ref<Function[]>([]);
const hasFetched = ref(false);

watch(
  () => perspectives.value,
  (newPers) => {
    neighbourhoods.value = Object.keys(newPers).reduce((acc, key) => {
      if (newPers[key]?.sharedUrl) {
        return {
          ...acc,
          [key]: newPers[key],
        };
      } else {
        return acc;
      }
    }, {});
  },
  { immediate: true },
);

/** @deprecated Prefer per-perspective subscribeQuery() over global addListener.
 *  This function broadcasts all link events across all perspectives. */
function addListeners(p: PerspectiveProxy) {
  p.addListener('link-added', (link) => {
    onAddedLinkCbs.value.forEach((cb) => {
      cb(p, link);
    });
    return null;
  });

  p.addListener('link-removed', (link) => {
    onRemovedLinkCbs.value.forEach((cb) => {
      cb(p, link);
    });
    return null;
  });
}

export function usePerspectives(client: Ad4mClient) {
  effect(async () => {
    if (hasFetched.value) return;
    // First component that uses this hook will set this to true,
    // so the next components will not fetch and add listeners
    hasFetched.value = true;

    // Get all perspectives
    const allPerspectives = await client.perspective.all();

    perspectives.value = allPerspectives.reduce((acc, p) => {
      return { ...acc, [p.uuid]: p };
    }, {});

    // Add each perspective to our state
    allPerspectives.forEach((p) => {
      addListeners(p);
    });

    client.perspective.addPerspectiveUpdatedListener((handle) => {
      client.perspective.byUUID(handle.uuid).then((perspective) => {
        if (perspective) {
          perspectives.value = {
            ...perspectives.value,
            [handle.uuid]: perspective,
          };
        }
      });
      return null;
    });

    // Add new incoming perspectives
    client.perspective.addPerspectiveAddedListener((handle) => {
      client.perspective.byUUID(handle.uuid).then((perspective) => {
        if (perspective) {
          perspectives.value = {
            ...perspectives.value,
            [handle.uuid]: perspective,
          };
          addListeners(perspective);
        }
      });
      return null;
    });

    // Remove new deleted perspectives
    client.perspective.addPerspectiveRemovedListener((uuid) => {
      perspectives.value = Object.keys(perspectives.value).reduce((acc, key) => {
        const p = perspectives.value[key];
        return key === uuid ? acc : { ...acc, [key]: p };
      }, {});
      return null;
    });
  }, {});

  function fetchPerspectives() {}

  function onLinkAdded(cb: Function) {
    onAddedLinkCbs.value.push(cb);
    return () => {
      const idx = onAddedLinkCbs.value.indexOf(cb);
      if (idx !== -1) onAddedLinkCbs.value.splice(idx, 1);
    };
  }

  function onLinkRemoved(cb: Function) {
    onRemovedLinkCbs.value.push(cb);
    return () => {
      const idx = onRemovedLinkCbs.value.indexOf(cb);
      if (idx !== -1) onRemovedLinkCbs.value.splice(idx, 1);
    };
  }

  return { perspectives, neighbourhoods, onLinkAdded, onLinkRemoved };
}
