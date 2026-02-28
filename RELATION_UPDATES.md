# Relation Updates Plan

Replaces overloaded `ad4m://has_child` predicates with unique semantic predicates across all
Flux models, and replaces the `useModel` hook with a new `useLive` hook that supports
parent-scoped reactive queries derived from `@HasMany` decorator metadata.

---

## 1. `flux/packages/constants/src/communityPredicates.ts`

Add new predicates — one for every parent→child relation that currently uses `ad4m://has_child`:

```ts
export const CHANNEL_MESSAGE = 'flux://has_message'; // Channel → Message
export const CHANNEL_CONVERSATION = 'flux://has_conversation'; // Channel → Conversation
export const CHANNEL_SUBCHANNEL = 'flux://has_subchannel'; // Channel → Channel (child)
export const CONVERSATION_SUBGROUP = 'flux://has_subgroup'; // Conversation → ConversationSubgroup
export const MESSAGE_THREAD = 'flux://has_thread_message'; // Message → Message (thread)
```

Note: `CHANNEL = 'flux://has_channel'` already exists and is the correct predicate for
`Community → Channel` but is not yet wired into the `@HasMany` decorator — fix that too.

---

## 2. `flux/packages/api/src/community/index.ts`

- Update `channels` `@HasMany` through from `'ad4m://has_child'` → `CHANNEL`

---

## 3. `flux/packages/api/src/channel/index.ts`

- Import `Message` and new constants: `CHANNEL_MESSAGE`, `CHANNEL_CONVERSATION`, `CHANNEL_SUBCHANNEL`
- Add new relation:
  ```ts
  @HasMany(() => Message, { through: CHANNEL_MESSAGE })
  messages: Message[] = [];
  ```
- Update `conversations` through: `'ad4m://has_child'` → `CHANNEL_CONVERSATION`
- Update `childChannels` through: `'ad4m://has_child'` → `CHANNEL_SUBCHANNEL`
- Update `unprocessedItems()` SurrealDB query:
  - Replace `predicate = 'ad4m://has_child'` (channel→item filter) → `predicate IN ['flux://has_message', 'flux://has_post', 'flux://has_task']`
  - The `flux://entry_type` check for messages becomes redundant once predicate is specific; retain for posts/tasks until they get their own predicates
  - Update reverse-traversal filter: `out<-link[WHERE predicate = 'ad4m://has_child' AND ...]` → `out<-link[WHERE predicate = 'flux://has_subgroup' AND ...]`
- Update `totalItemCount()` SurrealDB query with same predicate changes
- Add `'messages'` to the `HasManyMethods` interface export

---

## 4. `flux/packages/api/src/conversation/index.ts`

- Import `CONVERSATION_SUBGROUP` constant
- Update `subgroupEntities` `@HasMany` through: `'ad4m://has_child'` → `CONVERSATION_SUBGROUP`
- Update all SurrealDB query strings that reference `predicate = 'ad4m://has_child'` in a subgroup context → `predicate = 'flux://has_subgroup'`
- Update the link written in `processNewExpressions()` when connecting items to subgroups:
  `predicate: 'ad4m://has_child'` → `predicate: CONVERSATION_SUBGROUP`
- Update comments referencing `"ad4m://has_child" links`

---

## 5. `flux/packages/api/src/message/index.ts`

- Import `MESSAGE_THREAD`
- Update `thread` `@HasMany` through: `'ad4m://has_child'` → `MESSAGE_THREAD`

---

## 6. `ad4m/ad4m-hooks/react/src/useLive.ts` (new file — replaces `useModel.ts`)

New `useLive` hook with TypeScript overloads discriminated on presence of `id`:

### Types

```ts
type ModelCtor<T extends Ad4mModel> = (new (...args: any[]) => T) & typeof Ad4mModel;

type ParentScope<P extends Ad4mModel> = {
  model: ModelCtor<P>;
  id: string;
  field: keyof P; // must be a @HasMany field on P — hook reads decorator metadata to derive predicate
};

type LiveOptions<T extends Ad4mModel> = {
  perspective: PerspectiveProxy;
  parent?: ParentScope<any>; // scopes query to children of this parent
  query?: Query; // order, where, limit etc
  pageSize?: number;
  preserveReferences?: boolean;
};

type LiveCollectionResult<T> = {
  data: T[];
  loading: boolean;
  error: string;
  totalCount: number;
  loadMore: () => void;
};

type LiveInstanceResult<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};
```

### Overload signatures

```ts
// Collection
function useLive<T extends Ad4mModel>(model: ModelCtor<T>, options: LiveOptions<T>): LiveCollectionResult<T>;

// Single instance
function useLive<T extends Ad4mModel>(
  model: ModelCtor<T>,
  options: LiveOptions<T> & { id: string },
): LiveInstanceResult<T>;
```

### Key implementation detail — parent scope

When `parent` is provided the hook:

1. Reads `@HasMany` decorator metadata from `parent.model` for `parent.field`
2. Extracts the `through` predicate from that metadata
3. Constructs a scoped SurrealDB subscription watching only:
   `in.uri = parent.id AND predicate = <through>`

This means the subscription is precisely targeted — it never watches the whole perspective.

### Subscription scope for each mode

| Options                   | Watches                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| Neither `id` nor `parent` | All instances matching the model's `@Flag` predicate                     |
| `parent` provided         | Links where `in.uri = parent.id AND predicate = <through from @HasMany>` |
| `id` provided             | Links on the specific node `uri = id`                                    |

### Return value: `data` not `entries`

Uses `data` to align with ecosystem convention (TanStack Query, SWR, Apollo).

---

## 7. `ad4m/ad4m-hooks/react/src/index.ts`

- Remove: `export { useModel } from './useModel'`
- Add: `export { useLive } from './useLive'`
- Delete `useModel.ts`

---

## 8. `ad4m/ad4m-hooks/vue/src/useLive.ts` (new file — replaces `useModel.ts`)

Same logic as the React version but using Vue 3 reactivity primitives:

- `ref` / `shallowRef` instead of `useState`
- `watch` instead of `useEffect`
- `onUnmounted` for cleanup
- Return values are `Ref<T[]>` / `Ref<T | null>` rather than plain values
- Accept `perspective` as either `PerspectiveProxy` or `ComputedRef<PerspectiveProxy | null>` (same as current `useModel.ts`)

### Return types

```ts
type LiveCollectionResult<T> = {
  data: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string>;
  totalCount: Ref<number>;
  loadMore: () => void;
};

type LiveInstanceResult<T> = {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string>;
};
```

---

## 9. `ad4m/ad4m-hooks/vue/src/index.ts`

- Remove: `export { useModel } from './useModel'`
- Add: `export { useLive } from './useLive'`
- Delete `useModel.ts`

---

## 10. `flux/views/chat-view/src/components/ChatView/ChatView.tsx`

- Import `CHANNEL_MESSAGE` from `@coasys/flux-constants`
- Update link write in `submit()`:
  ```ts
  // before
  await perspective.add(new Link({ source, predicate: 'ad4m://has_child', target: message.id }));
  // after
  await perspective.add(new Link({ source, predicate: CHANNEL_MESSAGE, target: message.id }));
  ```

---

## 11. `flux/views/chat-view/src/components/MessageList/MessageList.tsx`

- Replace `useModel` import with `useLive`
- Import `Channel` from `@coasys/flux-api`
- Import `CHANNEL_MESSAGE` from `@coasys/flux-constants` (or rely on metadata — not needed at call site)
- Replace `useModel` call:

  ```ts
  // before
  const { entries, loading, totalCount, loadMore } = useModel({
    perspective,
    model: Message,
    query: { order: { createdAt: 'DESC' } },
    pageSize: PAGE_SIZE,
  });

  // after
  const {
    data: entries,
    loading,
    totalCount,
    loadMore,
  } = useLive(Message, {
    perspective,
    parent: { model: Channel, id: source, field: 'messages' },
    query: { order: { createdAt: 'DESC' } },
    pageSize: PAGE_SIZE,
  });
  ```

---

## Out of scope (follow-up work)

- `kanban-view-simple` uses `query: { source: channelId }` — `source` does not exist on the
  `Query` type so these calls are likely already broken. Migrate to `useLive` with `parent`
  once this work lands.
- `post-view` uses `useModel` without a source filter — same issue as the original message
  bug. Migrate to `useLive` as a follow-up.
- `flux-editor/dist/` — compiled output, regenerated by build, no manual changes needed.
- `ad4m-hooks` package version bump + changelog entry needed before publishing.
