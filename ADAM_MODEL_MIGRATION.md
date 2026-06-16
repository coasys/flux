# AD4M Model Migration Plan

Migrating `ad4m-hooks` (in the ad4m repo) and Flux from the legacy Prolog/Subject-proxy
API to the new SHACL-native `Ad4mModel` ORM introduced in PR #694.

**The `ad4m-hooks` changes belong in the ad4m PR itself** — the hooks are first-party SDK
packages that must be correct in the same release. Fix them first, in the `ad4m-model-refactor`
branch, then migrate Flux against the updated packages.

---

## Summary of breaking changes

| Old                                        | New                                                        |
| ------------------------------------------ | ---------------------------------------------------------- |
| `@ModelOptions({ name })`                  | `@Model({ name })`                                         |
| `@Collection({ through })`                 | `@HasMany({ through })`                                    |
| `@Optional({ through, ...opts })`          | `@Property({ through, ...opts })`                          |
| `@ReadOnly({ through, getter })`           | `@Property({ through, readOnly: true, getter })`           |
| `writable: true`                           | remove (writable is now the default)                       |
| `writable: false`                          | `readOnly: true`                                           |
| `resolveLanguage: 'literal'`               | remove entirely (`resolveLiteral: true` is now the default) |
| `resolveLanguage: <languageAddress>`       | `resolveLiteral: false` (non-literal expression languages)  |
| `entry.baseExpression`                     | `entry.id`                                                 |
| `new Model(perspective, id, source)`       | `new Model(perspective, id)` (source arg removed)          |
| `makeRandomPrologAtom(n)`                  | `makeRandomId(n)`                                          |
| `perspective.ensureSDNASubjectClass(M)`    | `M.register(perspective)`                                  |
| `perspective.createSubject(subject, base)` | `ModelClass.create(perspective, data)`                     |
| `perspective.getSubjectProxy(id, subject)` | `new ModelClass(perspective, id)` + `await instance.get()` |
| `modelQuery.subscribe(cb)`                 | `modelQuery.live(cb)` → returns `Subscription`             |
| `modelQuery.paginateSubscribe(...)`        | `modelQuery.paginate(size, page)` + `modelQuery.live(cb)`  |
| `modelQuery.dispose()`                     | `sub.unsubscribe()`                                        |
| `Query.source`                             | removed — no source scoping                                |
| `query.relations([...])` fluent            | `query.include({ field: true })`                           |
| `setCollection*` generated methods         | `set*` (e.g. `setCollectionReactions` → `setReactions`)    |
| `collectionToSetterName(x)` helper         | `relationToSetterName(x)` generating `set${X}`             |
| `Ad4mModel.transaction` batch idiom        | same — `Ad4mModel.transaction(p, async tx => { ... })` ✓   |
| `@InstanceQuery` decorator                 | removed entirely                                           |
| `@Field` decorator                         | equivalent to `@Property`                                  |

---

## Affected files by area

### Phase A · `ad4m-hooks` (ad4m repo — include in PR #694)

These ship as `@coasys/ad4m-react-hooks`, `@coasys/ad4m-vue-hooks`, `@coasys/hooks-helpers`.
They must be updated in the same release as the core API changes.

#### Scope decision: `useModel` only

After auditing Flux's actual usage, both hook packages are **slimmed down to export only `useModel`**.
Every other hook (`useMe`, `usePerspectives`, `useAgent`, `toCustomElement`) is already
implemented inside Flux's own packages (`@coasys/flux-react-web`, `@coasys/flux-vue`) and
the ad4m-hooks versions were redundant.

Flux import sites updated:

| Old import                                        | New import                                      |
| ------------------------------------------------- | ----------------------------------------------- |
| `useMe` from `@coasys/ad4m-react-hooks`           | `useMe` from `@coasys/flux-react-web`           |
| `toCustomElement` from `@coasys/ad4m-react-hooks` | `toCustomElement` from `@coasys/flux-react-web` |
| `usePerspectives` from `@coasys/ad4m-vue-hooks`   | `usePerspectives` from `@coasys/flux-vue`       |

Affected Flux files (already updated as part of Phase A):

- `views/post-view/src/components/Post/index.tsx`
- `packages/comment-section/src/main.ts`
- `packages/comment-section/src/Components/CommentSection/CommentSection.tsx`
- `packages/create/templates/preact/src/main.ts`
- `app/src/views/main/MainView.vue`

#### `ad4m-hooks/helpers` — **GUT entirely**

The `helpers` package previously contained `SubjectRepository` (`factory/`), `cache`, and `getProfile`.
None of these are imported from `@coasys/hooks-helpers` in Flux. The whole `src/` directory is
deleted; the package remains as an empty shell to avoid breaking any external consumers.

#### `ad4m-hooks/react/src/useModel.ts` — **rewrite**

Current design problems to fix alongside the API migration:

- **Memory leak** — `subscribeToCollection()` never returns a cleanup function; old listener hangs on unmount
- **Two-effect mount chain** — `ensureSubject` in one effect, watching `subjectEnsured` to trigger subscription; forces two render cycles before anything loads
- **No perspective change handling**
- **`paginateSubscribe` removed** — the growing-window strategy is correct for chat/feed infinite scroll (keeps reactions/replies on earlier messages live); just needs re-implementing with `live({ limit: pageSize * pageNumber })`
- **`JSON.stringify(query)` as dependency** — fragile

API changes:

- `perspective.ensureSDNASubjectClass(model)` → `model.register(perspective)` — move out of component mount into app init; just call once and don't gate the subscription on it
- `modelQueryRef.current.subscribe(cb)` → `modelQueryRef.current.live(cb)` returning `Subscription`; store ref, call `sub.unsubscribe()` in `useEffect` cleanup
- `modelQueryRef.current.paginateSubscribe(size, page, cb)` → `modelQuery.paginate(size, page)` for data + `modelQuery.live(cb)` for reactivity; true page-based pagination
- `modelQueryRef.current.dispose()` → `sub.unsubscribe()`
- `entry.baseExpression` → `entry.id` in `preserveEntryReferences`

#### `ad4m-hooks/vue/src/useModel.ts` — **rewrite**

Current design problems to fix alongside the API migration:

- **`includeBaseExpressions()` hack** — manually `Object.defineProperty` to make `baseExpression` enumerable for Vue reactivity; goes away entirely with `.id`
- **Perspective-as-ref dual-path** — overly complex; could be simplified
- **Same fake pagination and `JSON.stringify` issues as React**

API changes: same as React hook above, plus:

- Remove `includeBaseExpressions()` entirely
- `preserveEntryReferences()` keyed on `entry.baseExpression` → `entry.id`

---

### Phase B · `flux/packages/api` — model definitions

All model files share the same mechanical decorator changes:

| File                             | Decorators to rename                                                                                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/index.ts`                   | `@ModelOptions` → `@Model`, `writable: true` → remove                                                                                                                                                          |
| `channel/index.ts`               | `@ModelOptions` → `@Model`, `@Collection` → `@HasMany`, `@Optional` → `@Property`, `writable: true` → remove; `this.baseExpression` → `this.id` in `unprocessedItems()`, `totalItemCount()`, `conversations()` |
| `community/index.ts`             | `@ModelOptions` → `@Model`, `@Collection` → `@HasMany`, `@Optional` → `@Property`, `writable: true` → remove                                                                                                   |
| `conversation/index.ts`          | `@ModelOptions` → `@Model`, `@Optional` → `@Property`, `@Collection` → `@HasMany`, `writable: true` → remove                                                                                                   |
| `conversation-subgroup/index.ts` | same pattern                                                                                                                                                                                                   |
| `embedding/index.ts`             | `@ModelOptions` → `@Model`, `writable: true` → remove                                                                                                                                                          |
| `list/index.ts`                  | `@ModelOptions` → `@Model`, `@Collection` → `@HasMany`, `writable: true` → remove                                                                                                                              |
| `message/index.ts`               | `@ModelOptions` → `@Model`, `@Collection` → `@HasMany`, `@Optional` → `@Property`, `@ReadOnly` → `@Property({ readOnly: true })`, `writable: true` → remove                                                    |
| `post/index.ts`                  | `@ModelOptions` → `@Model`, `@Collection` → `@HasMany`, `@Optional` → `@Property`, `writable: true` → remove                                                                                                   |
| `semantic-relationship/index.ts` | `@ModelOptions` → `@Model`, `@Optional` → `@Property`, `writable: true` → remove                                                                                                                               |
| `task/index.ts`                  | `@ModelOptions` → `@Model`, `@Collection` → `@HasMany`, `writable: true` → remove                                                                                                                              |
| `task-board/index.ts`            | `@ModelOptions` → `@Model`, `writable: true` → remove                                                                                                                                                          |
| `task-column/index.ts`           | `@ModelOptions` → `@Model`, `writable: true` → remove                                                                                                                                                          |
| `topic/index.ts`                 | `@ModelOptions` → `@Model`, `writable: true` → remove                                                                                                                                                          |

#### `packages/api/src/factory/model.ts`

- `collectionToSetterName` → update to generate `set${X}` not `setCollection${X}`

#### `packages/api/src/factory/SubjectRepository.ts` — **DELETE**

`SubjectRepository` only has 4 call-sites in the entire codebase, all trivially
replaceable with direct `Ad4mModel` static methods:

| File                                      | Old call                                                                                  | Replacement                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `flux-container/src/flux-container.ts`    | `new SubjectRepository(Channel, { perspective }).getAllData()` (×2)                       | `Channel.findAll(perspective)`                         |
| `flux-container/src/flux-container.ts`    | `new SubjectRepository(Channel, { perspective, source: 'ad4m://self' }).create({ name })` | `Channel.create(perspective, { name })`                |
| `packages/vue/src/useCommunities.ts`      | `new SubjectRepository(Community, { perspective }).getData()`                             | `new Community(perspective, id); await instance.get()` |
| `packages/flux-editor/src/flux-editor.ts` | `new SubjectRepository(Message, { perspective }).create({ body })`                        | `Message.create(perspective, { body })`                |

**Also delete** `packages/api/src/factory/model.ts` (`collectionToSetterName` etc.) — only
consumed by `SubjectRepository`.

**Also delete** `packages/api/src/factory/index.ts` and remove the `factory/` export from
`packages/api/src/index.ts`.

Replace the `SubjectRepository` typed `@state()` property in `flux-editor.ts` with a
plain `PerspectiveProxy` reference or remove the field entirely.

#### `packages/api/src/conversation/util.ts`

- `embedding.baseExpression` → `embedding.id`

#### `packages/api/src/createCommunity.ts`

Check for `has_child` writes and `ensureSDNASubjectClass` calls → update to `M.register()`.

---

### Phase C · `flux/app`

#### `app/src/composables/useCommunityService.ts`

- Batch `ensureSDNASubjectClass(M)` calls → `Promise.all([Community, Channel, App, ...].map(M => M.register(perspective)))`
- All `x.baseExpression` reads → `x.id`
- `Conversation.findAll(perspective, { source: channel.baseExpression })` → `source` field removed from `Query`; replace with finding conversations via the channel's relation, or a `where` filter on a channel-id property
- `new Conversation(perspective, undefined, channel.baseExpression)` (3-arg constructor) → `new Conversation(perspective)` — the source arg is gone; attach to channel via the `@HasMany` relation on `Channel` instead
- `new App(perspective, undefined, channel.baseExpression)` → same
- Any other 3-arg `Ad4mModel` constructors with a source → drop 3rd arg

#### `app/src/stores/aiStore.ts`

- Scan for `baseExpression`, `@Collection`, `@Optional`, `writable:` patterns and apply same fixes.

---

### Phase D · `flux/views`

#### `chat-view` (`ChatView.tsx`, `MessageList.tsx`, `MessageItem.tsx`)

- `message.baseExpression` → `message.id`

#### `kanban-view` (`Board.tsx`, `CardDetails.tsx`, `Card.tsx`, `Entry.tsx`)

- `makeRandomPrologAtom` → `makeRandomId`
- `perspective.createSubject(selectedClass, baseExpression)` → `SelectedClass.create(perspective, data)`
- `perspective.getSubjectProxy(draggableId, selectedClass)` → `new SelectedClass(perspective, draggableId)` + `await instance.get()`
- `task.baseExpression` → `task.id` throughout
- Remove manual `ad4m://has_child` link writes (no longer needed)

#### `kanban-view-simple` (`Board.tsx`, `Column.tsx`, `TaskCard.tsx`, `TaskSettings.tsx`)

- Same `baseExpression` → `id` and subscribe API changes as kanban-view

#### `poll-view` (models + components)

- `models/Poll.ts`, `models/Answer.ts`, `models/Vote.ts` → decorator renames
- Components using `baseExpression` → `id`

#### `table-view` (models + components)

- `models/Todo.ts` → decorator renames
- Components using `baseExpression`, `subscribe`, `dispose` → update

#### `post-view` components

- `baseExpression` → `id`; any subscribe/dispose → live/unsubscribe

#### `nillion-file-store` (`subjects/File.ts`, `subjects/NillionUsers.ts`, `Files.tsx`)

- Decorator renames + `baseExpression` → `id`

#### `synergy-demo-view` (all components)

- `baseExpression` → `id`; subscribe → live

#### `flux-editor` (`packages/flux-editor/src/flux-editor.ts`)

- Scan for `baseExpression`, old decorators, subscribe patterns

---

### Phase E · `flux/packages/create` templates

#### `templates/preact/src/subjects/Todo.ts` and `templates/vue/src/subjects/Todo.ts`

- Decorator renames (serve as the scaffolded starting point for new apps)

#### `templates/preact/src/components/TodoView.tsx`

- `baseExpression` → `id`, subscribe → live

---

## Suggested execution order

**Phase A — ad4m repo (`ad4m-model-refactor` branch, include in PR #694)** ✅ DONE

1. ✅ Delete `ad4m-hooks/helpers/src/` content entirely (factory, cache, getProfile all removed)
2. ✅ Slim `@coasys/ad4m-react-hooks` to export only `useModel` (deleted useMe, usePerspectives, register, useAgent)
3. ✅ Slim `@coasys/ad4m-vue-hooks` to export only `useModel` (deleted useMe, usePerspectives, useAgent)
4. ✅ Rewrite `ad4m-hooks/react/src/useModel.ts` with new API
5. ✅ Rewrite `ad4m-hooks/vue/src/useModel.ts` with new API
6. ✅ Update Flux import sites (useMe/toCustomElement → flux-react-web; usePerspectives → flux-vue)
7. Merge PR #694

**Phase B — `flux/packages/api` model files** (after PR #694 is merged and packages updated) 5. Mechanical decorator renames across all 14 model files 6. Delete `packages/api/src/factory/` directory; inline the 4 `SubjectRepository` call-sites

**Phase C — `flux/app`** 7. `useCommunityService.ts` (most complex; see `Query.source` decision below) 8. `aiStore.ts`

**Phase D — `flux/views`** 9. `kanban-view/Board.tsx` (most complex view), then the rest mechanically

**Phase E — `flux/packages/create` templates** 10. Decorator renames + subscribe API in templates (scaffolding, not runtime)

---

## Key design decision: paginated `useModel`

The old hook used `paginateSubscribe(pageSize * pageNumber, 1, cb)` — a growing window from
offset 0. This was **intentional** for chat/feed-style infinite scroll: reactions and replies
on earlier messages must still update live even after the user has loaded many pages. True
fixed-window pagination would break this — an update to message 5 wouldn't re-render while
the user is viewing messages 21–40.

So the **growing-window strategy is correct** for the load-more use case. The only real
problem was `paginateSubscribe` being removed. The new API maps cleanly:

**Non-paginated (`pageSize` not set):**

```typescript
const sub = ModelClass.query(perspective, query).live(setEntries);
// cleanup: sub.unsubscribe()
```

**Load-more / infinite scroll (`pageSize` set):**

```typescript
// loadMore() increments pageNumber; effect tears down old sub and creates new one
// with the larger limit — live re-queries the full growing window on every link change
const sub = ModelClass.query(perspective, {
  ...query,
  limit: pageSize * pageNumber,
}).live((results) => {
  setEntries(results);
});
// cleanup: sub.unsubscribe()
```

`loadMore()` increments `pageNumber`, which triggers the effect to unsubscribe and
re-subscribe with the larger `limit`. The live subscription then keeps that full window
fresh on every subsequent link change.

`totalCount` can be fetched once on mount via `.count()` and is independent of the live
subscription (it only changes when items are created/deleted, not on every reaction/reply).

Note: `ModelQueryBuilder.paginate(size, page)` is still available for UIs that genuinely
want fixed-window pagination (e.g. a table with page navigation). The hook should support
both patterns — growing window when `loadMore` semantics are intended, fixed window when
the caller explicitly uses page numbers.

---

## Key design decision: `Query.source` removal

The old `findAll(perspective, { source: channelId })` filtered by `ad4m://has_child` parent.
That's removed. Options:

- **Option A**: Add a `channelId` property to `Conversation` and filter with `where: { channelId: channel.id }`
- **Option B**: Load conversations via the `Channel` model's `@HasMany` relation with `include`
- **Option C**: Keep a raw `querySurrealDB` call for the specific cases that need it

Option B is cleanest and most idiomatic with the new ORM.
