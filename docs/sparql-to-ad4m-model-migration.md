# Flux raw SPARQL → Ad4mModel migration: inventory + analysis

**Date:** 2026-06-04
**Scope:** `packages/api/src/{channel,conversation,conversation-subgroup,semantic-relationship,topic,conversation/util}.ts`
**Goal:** identify which raw `perspective.querySparql<T>()` call sites can be
expressed via `Ad4mModel`, which can't, and what we'd need to add to
`Ad4mModel` to close the gap. Comparisons against AD4M PRs
[#837](https://github.com/coasys/ad4m/pull/837), [#842](https://github.com/coasys/ad4m/pull/842),
[#846](https://github.com/coasys/ad4m/pull/846).

## Inventory

**28 raw SPARQL call sites in production code** (test mocks excluded), grouped
by file. The shape, intent, and inputs/outputs are summarised here for
reference; cross-references back to source lines preserved.

### `channel/index.ts` — 8 calls

| # | Method | Lines | Shape | Intent |
|---|---|---|---|---|
| 1 | `allItems()` | 101–118 | `?channel ad4m:has_child ?id` + reifier metadata + type filter + OPTIONAL property bag | Channel content timeline (Message / Post / Task), with `author`/`timestamp` from reifier, content body from OPTIONAL property triples |
| 2 | `unprocessedItems()` query 1 | 158–185 | `?channel ad4m:has_child ?id` + type filter | All item IDs in channel (preparation for set-difference) |
| 3 | `unprocessedItems()` query 2 | 174–186 | `?sg flux:has_item ?id` + type filter | All item IDs that are in *any* conversation subgroup (set of processed) |
| 4 | `unprocessedItems()` query 3 | 198–216 | `VALUES ?id { ... }` + reifier metadata + OPTIONAL property bag | Full data for unprocessed IDs only |
| 5 | `totalItemCount()` | 263–271 | `COUNT(DISTINCT ?id)` aggregate | Cardinality of channel items |
| 6 | `recentConversations()` (static) | 294–306 | Channel + `is_conversation` + OPTIONAL conversation child | List conversation channels (no reifier joins by design — was 60 s in earlier impl) |
| 7 | `pinnedConversations()` (static) | 357–370 | Channel + `is_pinned = true` + OPTIONAL conversation child | Pinned conversation channels |
| 8 | (covered in #2) | | | |

### `conversation/index.ts` — 6 calls

| # | Method | Lines | Shape | Intent |
|---|---|---|---|---|
| 9 | `stats()` (subgroups) | 60–74 | `?conv ad4m:has_child ?sg` + flag | Total subgroup count |
| 10 | `stats()` (participants) | 67–75 | `?conv flux:participant ?did` | Participant DIDs |
| 11 | `topics()` | 91–106 | SemanticRelationship → Topic, with UNION on `?expr = ?conv` OR `?conv ad4m:has_child ?expr` | Topics for this conversation OR any of its subgroups |
| 12 | `subgroupsData()` first | 144–157 | `?conv ad4m:has_child ?id` + reifier timestamp + OPTIONAL property bag | Subgroup names/summaries/timestamps |
| 13 | `subgroupsData()` batch | 179–192 | `VALUES ?sg { ... }` + reifier-traversal to channel ancestor + OPTIONAL transcript start | Per-subgroup item timestamps for sorting |

### `conversation-subgroup/index.ts` — 6 calls

| # | Method | Lines | Shape | Intent |
|---|---|---|---|---|
| 14 | `stats()` (items) | 53–69 | `?sg flux:has_item ?item` + FILTER IN on type | Total item count |
| 15 | `stats()` (participants) | 62–70 | `?sg flux:participant ?did` | Participant DIDs |
| 16 | `topics()` | 86–96 | SemanticRelationship → Topic | Topic list for this subgroup |
| 17 | `itemsData()` | 126–148 | `?sg flux:has_item ?id` + reifier timestamp + reifier author + OPTIONAL property bag + OPTIONAL channel ancestor reifier | Subgroup item timeline with author/timestamp/body/title |
| 18 | `topicsWithRelevance()` | 232–243 | SemanticRelationship → Topic + `has_relevance` | Topic list with per-SR relevance score |

### `semantic-relationship/index.ts` — 5 calls

| # | Method | Lines | Shape | Intent |
|---|---|---|---|---|
| 19 | `itemEmbedding(itemId)` | 27–38 | `?sr has_expression itemId` + `?sr has_tag ?embed` + `?embed flux:embedding ?vec` + LIMIT 1 | Resolve embedding URL for an item |
| 20 | `allConversationEmbeddings()` | 51–65 | All `?conv = Conversation` + Channel-via-`has_child` ancestor + SR + Embedding (4-way join) | Synergy embedding corpus for conversations |
| 21 | `allSubgroupEmbeddings()` | 87–103 | All `?sg = Subgroup` + Conversation parent + Channel grandparent + SR + Embedding (5-way join) | Synergy embedding corpus for subgroups |
| 22 | `allItemEmbeddings()` | 125–140 | All Message/Post/Task + Channel ancestor + SR + Embedding (4-way join) | Synergy embedding corpus across all item types |
| 23 | `allItemEmbeddingsByType(type)` | 176–190 | Same as 22 but single specific type | Per-type variant |

### `topic/index.ts` — 2 calls

| # | Method | Lines | Shape | Intent |
|---|---|---|---|---|
| 24 | `linkedConversations()` | 21–35 | Topic → reverse SR → Subgroup → reverse `has_child` → Conversation → reverse `has_child` → Channel | All Conversations linked to this Topic, with channel context |
| 25 | `linkedSubgroups()` | 60–74 | Same, but returns Subgroup not Conversation | Same as 24 at one less hop |

### `conversation/util.ts` — 1 call

| # | Method | Lines | Shape | Intent |
|---|---|---|---|---|
| 26 | `findEmbeddingSRId(itemId)` | 12–21 | SR by `has_expression = itemId` AND `has_tag.entry_type = has_embedding` + LIMIT 1 | Find SR ID for an item's embedding (cleanup path) |

*(28 total = 26 unique sites + 2 collapsed under #2/#3 in the table; the
`unprocessedItems()` chain reuses query 1 inside query 2's filtering.)*

---

## What `Ad4mModel` supports today

Verified from the model classes in `packages/api/src/` and the AD4M
`@coasys/ad4m` SDK:

- **`@Flag({ through, value })`** — equality test on a "tag" predicate (e.g.
  `entry_type = flux://has_channel`). Discriminates entity types.
- **`@Property({ through })`** — scalar property via a predicate. Stored as a
  literal-encoded link target.
- **`@HasMany(() => Class)` / `@HasMany({ through })`** — relation that
  resolves to an array of related instances or raw IRIs.
- **`findAll(perspective, { where, include, limit, offset, order })`** —
  query for instances matching `where` clauses, optionally eager-loading
  relations via `include`, with pagination + ordering.
- **`where: { property: value }`** / **`where: { property: [v1, v2] }`** —
  String equality, StringArray (`IN`), Number, Bool, Ops (`gt`/`lt`/`between`/
  `contains`/`not`), NumberArray.
- **`include: { relation: true }`** — eager-load named relations.
- **`include: { relation: { properties, where, include, limit, order } }`** —
  deep-include with per-relation filters and projections.
- **`projections: { $key: { from, where, count, limit, target_class_name } }`**
  — `$key`-prefixed lightweight relation aggregations.
- **`parent: { model, id }` / `parent: { id, predicate }`** — scope query
  results to children of a specific parent instance.
- **`save(batchId)` / `delete()`** — CRUD with batch coordination.

### What `Ad4mModel` does NOT support today

- **Reverse relations on `HasMany`/`HasOne` at decoration time** — i.e.
  declaring "find my parent Channel via `ad4m:has_child` direction=reverse".
  *Partial:* `direction: 'reverse'` exists for `@HasMany` but it requires the
  parent class to be expressible up-front. There is no `@BelongsTo()`-style
  parent decorator.
- **Cross-class WHERE conditions joining two unrelated models** — e.g.
  "find all `Embedding` instances whose ID is the tag of some
  SemanticRelationship whose expression is this Conversation". This is what
  the Synergy queries do via multi-hop SPARQL; Ad4mModel currently has no
  pattern for that other than two separate `findAll` calls glued in JS.
- **Multi-level `include` chains** — `include: { rel1: { include: { rel2: true } } }`
  is supported, but the relation graph has to be declared on both ends and the
  predicates have to match the storage model exactly. Where Flux's data
  storage uses one-off predicates with implicit hops, the decorator path
  doesn't capture it.
- **`UNION` of two query shapes against the same target type** — e.g.
  Conversation's `topics()` does
  `{ ?expr = ?conv } UNION { ?conv has_child ?expr }` to grab topics
  belonging directly to the conversation OR to any of its subgroups in one
  query.
- **Reifier metadata as queryable fields** — `author`/`timestamp` of a
  *specific link* (not the entity). Ad4mModel exposes `createdAt`,
  `updatedAt`, and `author` synthesised across an instance's reifiers
  during hydration, but you cannot ask "give me the timestamp of THIS
  specific link" through Ad4mModel's where clause.
- **Set-difference / NOT EXISTS** — the `unprocessedItems` pattern.

---

## Category breakdown + Ad4mModel feasibility

### A. Trivially convertible (5 sites)

Sites where the query is a single-class lookup with a simple `where` clause.
Direct `findAll` mapping. *Note: the existing code still wins on raw-SPARQL
because the model-query builder adds conformance joins this query doesn't
need. Whether to convert is a maintainability/perf trade-off.*

| # | Method | Convert to |
|---|---|---|
| 5 | `Channel.totalItemCount()` | `findAll(Message)` + `findAll(Post)` + `findAll(Task)` w/ `parent: { model: Channel, id }`, sum lengths. Or `findAll(Channel, { id: this.id, include: { messages: { count: true }, posts: { count: true }, tasks: { count: true } } })`. |
| 6 | `Channel.recentConversations()` | `findAll(Channel, { where: { isConversation: true }, include: { conversations: true } })` + Rust hydration synthesises `updatedAt`. |
| 7 | `Channel.pinnedConversations()` | `findAll(Channel, { where: { isPinned: true }, include: { conversations: true } })`. |
| 10 | `Conversation.stats()` participants | `findAll(Conversation, { id, properties: ['participants'] })` then `instance.participants`. |
| 15 | `Subgroup.stats()` participants | Same shape as 10. |

### B. Convertible with deep `include` + new reverse relations (10 sites)

Sites that join 2–4 model classes via existing forward relations. Convertible
if the model classes get a `@HasMany`/`@HasOne` declaring the reverse direction.

| # | Method | What's needed |
|---|---|---|
| 9 | `Conversation.stats()` subgroups | `findAll(Subgroup, { parent: { model: Conversation, id } })`. **Today**: already supported via `subgroups()` method on the model. The SPARQL is redundant. |
| 14 | `Subgroup.stats()` items | `findAll([Message, Post, Task], { parent: { model: Subgroup, id, predicate: 'flux://has_item' } })`. Needs **multi-class polymorphic `findAll`**. |
| 16 | `Subgroup.topics()` | `findAll(SemanticRelationship, { where: { expression: this.id }, include: { tag: true } })` → filter where `tag.entry_type = has_topic`. Needs **`tag` decorated as `@HasOne(() => Topic|Embedding, ...)` with discriminator**. |
| 18 | `Subgroup.topicsWithRelevance()` | Same as 16 with relevance property already on SR. |
| 11 | `Conversation.topics()` | Same as 16 but with the UNION; can be expressed as **two `findAll` calls** in JS, dedup. Or convert to a single SPARQL query (no good Ad4mModel shape today). |
| 19 | `SemanticRelationship.itemEmbedding(id)` | `findAll(SR, { where: { expression: id }, include: { tag: true }, limit: 1 })`. Needs **`tag` as `@HasOne(Embedding)`**. |
| 20 | `SR.allConversationEmbeddings()` | `findAll(Conversation, { include: { /* parent channel */, /* incoming SR */ : { include: { tag: { properties: ['embedding'] } } } } })`. Needs **incoming-relation declarations** (reverse `has_expression`). |
| 21 | `SR.allSubgroupEmbeddings()` | Same shape with one more parent hop. |
| 22 | `SR.allItemEmbeddings()` | Same as 20 but across three item classes. Needs **multi-class polymorphic `findAll`** or three separate calls. |
| 23 | `SR.allItemEmbeddingsByType(type)` | Single-class variant of 22. Convertible with current Ad4mModel + the `tag` decoration upgrade. |

### C. Convertible but the raw SPARQL is the better shape (4 sites)

Sites where the SPARQL is doing reifier-metadata reads (`?_reifier`
`ad4m:ontology/timestamp` / `author`). Ad4mModel already synthesises
`createdAt`/`updatedAt`/`author` per instance during hydration — *but only
once per instance*, not per individual link.

| # | Method | Why raw SPARQL is correct |
|---|---|---|
| 1 | `Channel.allItems()` | Wants `timestamp` of *the `has_child` link*, not of the message entity. The link timestamp is when the message was *added to the channel*, which differs from when the message entity was created (e.g. message edited after add). Ad4mModel's hydrated `createdAt` refers to the entity, not the link. |
| 4 | `Channel.unprocessedItems()` data fetch | Same as 1. |
| 12 | `Conversation.subgroupsData()` first | Same: wants `?conv has_child ?sg` link timestamp. |
| 17 | `Subgroup.itemsData()` | Joins reifier-on-`has_item` AND reifier-on-`entry_type` to extract author at type-tag time. Even more complex link-level semantics. |

**Potential Ad4mModel feature:** `include: { rel: { meta: ['timestamp', 'author'] } }`
— eager-load per-link reifier metadata as a sidecar on each related instance.

### D. Set-difference (2 sites)

| # | Method | Convertibility |
|---|---|---|
| 2 + 3 | `Channel.unprocessedItems()` set-difference | **Best left as SPARQL.** `FILTER NOT EXISTS` in Oxigraph was 60 s — the code already migrated to the set-difference workaround. Ad4mModel doesn't support either pattern natively. Adding `where: { NOT: { … } }` could work but the underlying SPARQL would have the same planner cliff (until named graphs from [#812](https://github.com/coasys/ad4m/pull/812) land). |

### E. Inter-class joins with no model relation (4 sites)

Sites that join entities via a predicate that's not declared as a relation on
the model class.

| # | Method | Why |
|---|---|---|
| 13 | `Conversation.subgroupsData()` batch (Subgroup → channel ancestor) | Joins subgroup → its grandparent Channel via two `ad4m:has_child` hops. Ad4mModel models this as ascending parents, which the current decorator API can't express. |
| 24 | `Topic.linkedConversations()` | Topic → reverse SR → reverse `has_child` chain to Conversation and Channel. **Bidirectional traversal** through multiple relations not declared on Topic. |
| 25 | `Topic.linkedSubgroups()` | Same. |
| 26 | `findEmbeddingSRId(itemId)` | SR.tag must dereference to an Embedding instance + filter on its `entry_type`. Today returns SR ID only; the tag-as-relation upgrade would let `findAll(SR, { where: { expression: id, tag: { type: 'flux://has_embedding' } } })`. **Nested-where on a relation** is a missing capability. |

---

## Recommended `Ad4mModel` additions, prioritised

Inferred from the gaps above, ordered by how many call sites each unlocks:

### 1. **`tag` as a typed relation** (`@HasOne(() => Embedding)` with discriminator) — unlocks 10 call sites

Currently `SemanticRelationship.tag` is `@Property(string)` storing a raw IRI.
Upgrading to `@HasOne(() => Embedding | Topic, { through: 'flux://has_tag' })`
with type discrimination on `entry_type` would let every embedding/topic
traversal in `semantic-relationship/`, `topic/`, `conversation/`, and
`conversation-subgroup/` flow through `include: { tag: true }`.

This is mechanical and small. Highest-leverage Ad4mModel addition.

### 2. **Reverse relation declaration / `@BelongsTo()`** — unlocks 8 call sites

Today's `@HasMany({ direction: 'reverse' })` works but requires the parent
class to be expressed in the decorator. A cleaner story would be:

```ts
@BelongsTo(() => Conversation, { through: 'ad4m://has_child' })
parentConversation: Conversation;
```

Then queries like `Subgroup.findAll({ include: { parentConversation: { include: { parentChannel: true } } } })` become natural.

### 3. **Multi-class polymorphic `findAll`** — unlocks 4 call sites

```ts
findAll([Message, Post, Task], { parent: { model: Subgroup, ... } })
```

Today you have to enumerate three calls and union the results client-side.
The Ad4mModel runtime knows enough about SHACL shapes to dispatch this in one
SPARQL execution.

### 4. **Per-link reifier metadata sidecar** (`include: { rel: { meta: [...] } }`) — unlocks 4 call sites

Right now `Channel.allItems()` and related sites want the *link* author and
timestamp, not the *entity* author and timestamp. Adding a `meta:` projection
on the include relation would replace the reifier-walking SPARQL.

### 5. **Nested `where` on relations** — unlocks 1 call site (but a common-feeling pattern)

```ts
findAll(SR, { where: { expression: id, tag: { type: 'flux://has_embedding' } } })
```

### 6. **UNION across query shapes** — unlocks 1 call site

Probably not worth a first-class API. The `Conversation.topics()` UNION pattern
can be rewritten as two `findAll`s + JS dedup at the cost of one extra RTT.

---

## What should stay as raw SPARQL

Recommended permanent exemptions:

1. **`Channel.unprocessedItems()` set-difference** (sites 2+3) — the
   `FILTER NOT EXISTS` planner cliff is documented in the [`ac57680b9` warning](https://github.com/coasys/ad4m/commit/ac57680b9).
   The current set-difference workaround (3 SPARQL queries + JS set) is the
   right shape for this. Ad4mModel `where: { NOT: { … } }` would degrade to
   the same `FILTER NOT EXISTS` plan.

2. **`Conversation.subgroupsData()` batch timestamp lookup** (site 13) — the
   two-hop ascendant walk to find a subgroup's channel is genuinely model-
   shape-bending. Until the SHACL DSL gets bidirectional path support,
   leaving this as a single targeted SPARQL is simpler than the equivalent
   Ad4mModel composition.

3. **The reifier-timestamp queries** (sites 1, 4, 12, 17) — *if* the per-link
   `meta:` sidecar is not added.

---

## Performance considerations (not yet measured)

The investigation deliberately stopped short of running a benchmark suite
on dev. Expected behaviour based on what we know about the planner +
hydration paths:

- **Trivially-convertible sites (Category A)** likely come out *slightly
  worse* in Ad4mModel because the model-query builder pays for SHACL shape
  resolution + conformance joins that the targeted SPARQL skips. The
  trade-off is type safety and one fewer place to maintain. **Recommendation:
  micro-bench any conversion before committing**.

- **Multi-hop convertible sites (Category B)** likely come out *better* in
  Ad4mModel because the batched-`include` path is one round-trip with the
  hydration done in Rust, whereas the current pattern is "raw SPARQL +
  per-row `getExpression()` calls in JS" (visible in
  `semantic-relationship/index.ts` lines 41 / 69 / 107 / 150 / 194). That's a
  textbook N+1 already, and the deep include eliminates it.

- **Reifier-metadata sites (Category C)** are status-quo SPARQL. Without the
  `meta:` projection feature, no conversion is worth attempting.

- **Set-difference (Category D)** stays SPARQL.

Concrete bench plan for follow-up:

1. Build a Node.js harness that runs each query both ways against a seeded
   executor (e.g. Channel with N=10/100/1000 messages, M=2/20/200 conversations).
2. Measure wall-clock + round-trip count for each pair.
3. Tabulate.
4. Recommend per-site keep-as-SPARQL vs convert-to-Ad4mModel based on the
   data.

This benchmarking is out of scope for the inventory phase and is the
natural next deliverable on this branch.

---

## Suggested follow-ups

- **Stage 1 (this PR):** inventory + analysis (this document). No code
  changes.
- **Stage 2:** add the `tag`-as-relation upgrade to `SemanticRelationship`
  (touches `packages/api/src/semantic-relationship/index.ts` and any callers
  that read `.tag` as a string). One PR, mechanical, no Ad4mModel-side
  changes required (uses existing `@HasOne`).
- **Stage 3:** Ad4mModel-side: `@BelongsTo()` decorator for clean reverse
  relations. AD4M PR.
- **Stage 4:** convert Category B sites that benefit from `include: { tag: true }`.
- **Stage 5:** benchmark suite against `dev` to validate each conversion.
- **Stage 6:** decide on per-link reifier `meta:` sidecar based on whether
  Category C sites are visibly slow in real Flux usage.

---

## Implementation log

### 2026-06-04: AD4M decorator availability re-check

While starting Stage 2, verified that `@coasys/ad4m`'s `core/src/model/decorators.ts` already exports `HasOne`, `BelongsToOne`, and `BelongsToMany`, with `where` + `filter` options on every relation. **This significantly re-scopes the recommendation table** — three of the six items I had marked as needing AD4M SDK work are actually feasible flux-side:

| # | Recommendation | Original assumption | Re-checked status |
|---|---|---|---|
| 1 | `tag` as typed `@HasOne(Embedding \| Topic)` | flux-only | ✅ flux-only, confirmed |
| 2 | `@BelongsTo()` / first-class reverse relations | needs AD4M SDK PR | ✅ **already in AD4M** as `@BelongsToOne` / `@BelongsToMany` — flux-only |
| 3 | Multi-class polymorphic `findAll` | needs AD4M SDK PR | ❌ needs AD4M (target is `() => Ad4mModelLike`, a single class) |
| 4 | Per-link reifier metadata sidecar | needs AD4M SDK PR | ❌ needs AD4M (no `meta:` projection on `include`) |
| 5 | Nested `where` on relations | needs AD4M SDK PR | ✅ **already in AD4M** — `RelationOptions.where` is wired into `@HasOne`/`@HasMany`/`@BelongsTo*` |
| 6 | UNION across query shapes | maybe AD4M | ❌ workaround via two `findAll`s + JS dedup |

### Stage 2 commit (this branch)

**Implemented:** `SemanticRelationship.tag` upgrade with two same-predicate `@HasOne` relations:

```ts
@HasOne(() => Embedding, { through: 'flux://has_tag' })
embeddingTag?: Embedding;

@HasOne(() => Topic, { through: 'flux://has_tag' })
topicTag?: Topic;
```

The conformance filter on each target class's `@Flag` discriminates at hydration time — only Embedding instances bind to `embeddingTag`, only Topic instances bind to `topicTag`. The pre-existing `tag: string` `@Property` is kept for back-compat (callers that want the raw IRI).

**Demonstrator conversion:** `SemanticRelationship.itemEmbeddingViaModel(itemId)` shows the converted shape side-by-side with the original raw-SPARQL `itemEmbedding(itemId)`. Behavioural parity caveat is documented in the method's TSDoc: the model variant returns the embedding-vector URL the same way the SPARQL variant does, then both call `perspective.getExpression()` for the actual vector — the model-query layer does not yet inline-resolve `resolveLanguage` properties on `@HasOne`-loaded instances.

### Bench harness scaffolded

`scripts/bench-sparql-vs-ad4m.ts` checked in as a documented skeleton: connection helper + `timeIt(label, fn, runs)` + the bench-case enumeration. **Seed + connection are stubs** — implementing them requires (a) a multi-user-mode executor running locally, (b) a JWT for that executor, (c) seed code that creates ~10 model classes' worth of related instances at scale. Estimated 200 LOC of additional work to make runnable. Tracked as Stage 5.

### Why no perf numbers yet

The benchmark depends on a running executor with the Flux subject classes registered + a sizeable seeded perspective. The wind-tunnel scenarios in `coasys/ad4m-wind-tunnel` are a heavier alternative (they would need to cross-import flux's `@coasys/flux-api`, which they currently don't). Three options for getting to numbers, in increasing order of work:

1. **Manual bench**: spin a local executor, seed via a one-off script, run the bench harness above. ~1 hour wall clock per scale point.
2. **Vitest-based integration test in flux**: extend `packages/api/src/conversation/conversation.test.ts`-style infrastructure to boot a real executor. ~half-day of test-infra plumbing.
3. **New wind-tunnel scenario (s11) that cross-imports flux-api**: pleasant for repeat comparisons, but requires resolving the cross-repo dep + making the wind tunnel reproducibly drive an Ad4mModel-aware path. ~1-2 days.

This PR leaves it at option 1 documented; the harness skeleton + the converted `itemEmbeddingViaModel` are enough to make the bench a copy-paste-and-run exercise once the seed is in place.

### Remaining work in this branch's plan

- **Stage 3 (next commit):** add `@BelongsToOne` / `@BelongsToMany` decorators to Channel, Conversation, Subgroup, Topic models for the reverse traversals that Synergy queries currently express via SPARQL. Unlocks 8 sites.
- **Stage 4:** write `findAll`-shaped variants of `allConversationEmbeddings` / `allSubgroupEmbeddings` / `allItemEmbeddings` / `linkedConversations` using `embeddingTag`/`topicTag` + the new BelongsTo declarations.
- **Stage 5:** flesh out the bench harness seed; run; record numbers per converted method; update this section with the table.
- **Stage 6 (separate AD4M PR):** polymorphic `findAll` + per-link reifier `meta:` projection — unlocks the remaining sites.

### Reading guide for reviewers

If you only have 10 minutes:
1. Read this implementation log section to see what's actually in the branch.
2. Skim `packages/api/src/semantic-relationship/index.ts` for the @HasOne upgrade and the `*ViaModel` demonstrator.
3. The categorisation table above is the load-bearing decision artifact — challenge it.

### Empirical bench results — wind tunnel S16 vs `dev`

Lives in the AD4M Wind Tunnel as scenario **`s16-sparql-vs-model`**
([`ad4m-wind-tunnel/src/scenarios/s16-sparql-vs-model.ts`](https://github.com/coasys/ad4m-wind-tunnel/blob/main/src/scenarios/s16-sparql-vs-model.ts)) — not an ad hoc script. The scenario seeds a Flux-shaped graph (channel → messages with body/author/timestamp; embeddings; semantic-relationship reifiers linking each message to an embedding; topics tagging some messages), registers SHACL subject classes inline (Message / Embedding / Topic / SemanticRelationship), and for each candidate query times raw `querySparql` against the equivalent `perspective.modelQuery` call back-to-back on the same perspective.

Reproduce:

```bash
cd ad4m-wind-tunnel
./run.sh --branch dev --scenario s16 \
  --executor-path /path/to/ad4m/target/release/ad4m-executor
# Results land in results/dev/s16-sparql-vs-model.json.
# S16_RUNS=N overrides per-case runs (default 10).
```

Results below are 10 runs/case (+ 1 warm-up each), Apple Silicon (48 GB / 14 CPU), against `dev` (`1f29d0b17 fix(ci): clear stale bootstrap-language build cache before rebuild`).

#### Small tier — 100 items, 1051 links

| Case | raw SPARQL avg | `modelQuery` avg | ratio |
|---|---:|---:|---:|
| `sr_by_expression_limit1` (single-row, `WHERE expression=…` + LIMIT 1) | 0.24 ms | 3.43 ms | **14.2×** |
| `sr_by_expression_with_include` (same + `include: { embeddingTag }`) | 0.22 ms | 3.38 ms | **15.0×** |
| `sr_all` (scan all SRs, no where) | 0.67 ms | 14.39 ms | **21.5×** |
| `embeddings_all` (scan all embeddings) | 0.55 ms | 8.50 ms | **15.5×** |
| `topics_all` (scan all topics — smallest set) | 0.21 ms | 6.70 ms | **31.1×** |

#### Medium tier — 1000 items, 10151 links

| Case | raw SPARQL avg | `modelQuery` avg | ratio |
|---|---:|---:|---:|
| `sr_by_expression_limit1` | 0.52 ms | 28.86 ms | **56.0×** |
| `sr_by_expression_with_include` | 0.51 ms | 28.38 ms | **55.5×** |
| `sr_all` | 7.57 ms | 155.18 ms | **20.5×** |
| `embeddings_all` | 4.93 ms | 90.46 ms | **18.4×** |
| `topics_all` | 0.47 ms | 71.13 ms | **150.7×** |

**Three concrete findings — each materially changes the categorisation in the inventory above:**

#### 1. The `@HasOne` "polymorphic on same predicate" trick doesn't work

`include: { embeddingTag: true }` and `include: {}` produce timings within noise at both scales (e.g. 28.86 vs 28.38 ms at medium). S16 explicitly flags this with `include actually fires: false` in its summary when the two model timings agree to within 5 %. Two `@HasOne` decorators on the same `flux://has_tag` predicate (one targeting Embedding, one targeting Topic) cannot both fire from a single model query as implemented today — the runtime path is dead.

This **invalidates Stage 2's central assumption** and **invalidates recommendation #1** in the prioritised additions table. The block isn't in flux — it's in the Rust model-query implementation in `coasys/ad4m`. Whoever picks this up needs to either:

- Add support for multiple relations sharing a predicate, with conformance dispatch at query time.
- Land "multi-class polymorphic findAll" (recommendation #3) and rebuild `embeddingTag` as a discriminator on top.

#### 2. `findAll` overhead scales linearly with corpus size regardless of `LIMIT 1`

`findAll(SR, { where: { expression: id }, limit: 1 })` costs 3.43 ms at small (100 items) and **28.86 ms at medium (1000 items)** — an 8.4× slowdown for a 10× corpus growth. Raw SPARQL with the same `LIMIT 1` stays at 0.24 vs 0.52 ms across the same range (~2×, in line with index lookup cost). The conformance scan and/or property-fetch isn't being short-circuited by the LIMIT.

This **invalidates the Category A "trivially convertible" assumption** that the model-query builder's overhead was a constant tax. It isn't — it's a linear-in-N tax. Converting `Channel.totalItemCount` or `Channel.pinnedConversations` to `Ad4mModel.findAll` would visibly regress as Flux communities grow.

#### 3. Even when `findAll` is doing the *right* work, it's an order of magnitude slower than raw SPARQL doing more work

Raw SPARQL is performing a 4-hop join (SR → Embedding → entry_type filter → embedding URL) and returning the surfaced embedding URL. Ad4mModel is returning the SR base entity only (no embedding URL surfaced — see finding #1). Ad4mModel doing *less* work is still 14× slower at small and 56× slower at medium for the single-row case, and 150× slower for the small-result topics scan.

The gap is not in the SPARQL execution — it's in the model-query orchestration layer: SHACL shape resolution + conformance pattern emission + result hydration. None of which carries weight when the answer is a single row.

#### Re-scoped recommendations

Given the empirical data, the prioritised additions table should be re-read as:

| Original rank | Reality | What it actually means |
|---|---|---|
| #1 tag as `@HasOne` polymorphic | **Doesn't work** without AD4M-side multi-relation-per-predicate dispatch | Becomes a recommendation against the executor's model_query layer, not flux |
| #2 `@BelongsTo` | Decorators exist; **runtime behaviour unverified** at scale | Bench before relying on it for any conversion |
| #3 Polymorphic `findAll` | Confirmed AD4M-side need | Reaffirmed |
| #4 Per-link reifier `meta:` | Confirmed AD4M-side need | Reaffirmed |
| #5 Nested `where` on relations | Decorator option exists; **runtime not benched** | Same caveat as #2 |
| #6 UNION across queries | Not blocking | Same |

And the per-site verdict:

| Category | Original verdict | Bench-grounded verdict |
|---|---|---|
| A. Trivially convertible (5 sites) | "Slight perf regression, trade-off for type safety" | **Major perf regression — 14–150× slower. Keep as raw SPARQL.** |
| B. Convertible with new features (10 sites) | "Likely a perf win because it collapses N+1" | **Unverified.** The N+1 in flux is `await Promise.all(rows.map(getExpression))` after one SPARQL call — getExpression hits a language-controller cache, so the cost is data-dependent. Adding more S16 cases that drive multi-row hydration + `BelongsTo` traversal (next iteration) would settle this; the current numbers say the model-query layer's per-row overhead alone (3-28 ms) already exceeds the SPARQL-then-cached-getExpression baseline for any realistic N. |
| C. Reifier-metadata reads (4 sites) | "Keep as SPARQL" | Reaffirmed |
| D. Set-difference (2 sites) | "Keep as SPARQL" | Reaffirmed |
| E. Inter-class joins (4 sites) | "Mixed" | Lean further toward SPARQL given Cat A perf result |

**Bottom line for this PR's stated goal — "convert flux raw SPARQL to Ad4mModel where possible":** the bench data argues against most conversions until the AD4M-side `model_query` layer's per-instance overhead is brought down. The right work isn't migrating call sites in flux — it's investigating *why* `findAll` is 14-150× slower than raw SPARQL even for a single-row lookup, and fixing it in `coasys/ad4m`. S16 will land as a regression gate against that work: any future `model_query` change can re-run it and watch the ratios collapse toward 1×.
