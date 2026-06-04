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

> **Correction.** A first v1 of S16 reported "include doesn't fire" and 14–150× ratios — those numbers are now superseded. The SHACL JSON the scenario sent to the executor put `@HasOne` relations in a separate top-level `relations: []` array, which Rust's `SHACLShape` deserializer silently dropped, so the relation was never registered and `resolve_includes_recursive` had nothing to do. Once relations are emitted inside `properties:` with `relation_kind: "hasOne"` (the canonical form from `@coasys/ad4m`'s `SHACLShape.toJSON()`), include fires and the ratios collapse 3–10×. Both the old and new numbers are kept below for the review trail; treat the post-fix numbers as the ground truth.

Results below are 10 runs/case (+ 1 warm-up each), Apple Silicon (48 GB / 14 CPU), against `dev` (`1f29d0b17 fix(ci): clear stale bootstrap-language build cache before rebuild`).

#### Small tier — 100 items, 1051 links — `include actually fires: yes`

| Case | raw SPARQL avg | `modelQuery` avg | ratio | (was, pre-fix) |
|---|---:|---:|---:|---:|
| `sr_by_expression_limit1` (1-row, `WHERE expression=…` + LIMIT 1) | 0.23 ms | 0.56 ms | **2.4×** | 14.2× |
| `sr_by_expression_with_include` (same + `include: { embeddingTag }`) | 0.22 ms | 0.69 ms | **3.1×** | 15.0× |
| `sr_all` (scan all SRs, no where) | 0.62 ms | 5.25 ms | **8.5×** | 21.5× |
| `embeddings_all` (scan all embeddings) | 0.41 ms | 3.57 ms | **8.8×** | 15.5× |
| `topics_all` (scan all topics — smallest set) | 0.17 ms | 0.95 ms | **5.7×** | 31.1× |

#### Medium tier — 1000 items, 10151 links — `include actually fires: yes`

| Case | raw SPARQL avg | `modelQuery` avg | ratio | (was, pre-fix) |
|---|---:|---:|---:|---:|
| `sr_by_expression_limit1` | 0.51 ms | 2.58 ms | **5.0×** | 56.0× |
| `sr_by_expression_with_include` | 0.55 ms | 2.99 ms | **5.5×** | 55.5× |
| `sr_all` | 7.29 ms | 68.25 ms | **9.4×** | 20.5× |
| `embeddings_all` | 4.09 ms | 43.29 ms | **10.6×** | 18.4× |
| `topics_all` | 0.28 ms | 7.08 ms | **25.0×** | 150.7× |

### What the remaining 5–25× gap is

Re-ran S16 against an executor patched with `MODEL_QUERY_PROFILE=1` instrumentation that emits per-phase wall-clock timings + the literal SPARQL strings (patch lives at `query.rs` in a throwaway temp clone — not part of any PR; intended to graduate into a `tracing` span scaffolding follow-up). The patch times each step in `execute_model_query_inner`: SPARQL build, two-phase pagination subquery exec, properties subquery exec, count exec, hydration, language transforms, getters, recursive includes.

#### Per-call breakdown — medium tier (1000 items)

`sr_by_expression_with_include` (model 2.99 ms end-to-end; raw 0.55 ms):

| phase | ms | what |
|---|---:|---|
| `build_instance_sparql` | 0.002 | string concatenation |
| `twophase-pagination-exec` | 0.164 | `SELECT ?source ?_first_ts … ORDER BY ?_first_ts LIMIT 1` |
| `twophase-properties-exec` | 0.101 | `VALUES ?source { … } VALUES ?predicate { 4 props } … + reifier metadata` (3 rows) |
| `count-exec` | 0.118 | `SELECT COUNT(DISTINCT ?source)` — fired unconditionally when pagination is on |
| Rust orchestration (group + hydrate + lang transforms) | ~0.01 | trivial |
| include sub-query (`Embedding @d1`, single-instance + recursive overhead) | 0.741 | 2-row SPARQL + `resolve_includes_recursive` |
| **sum of `model_query` work** | **~1.13** | |
| RPC roundtrip + JSON marshalling | **~1.86** | WS frame, capability check, perspective lookup, outer JSON serialize |

`sr_all` (model 68.25 ms; raw 7.29 ms):

| phase | ms | what |
|---|---:|---|
| `single-instance-exec` | ~65 | One big SPARQL fetching 3090 rows (1030 SRs × 3 properties). Per-row work is *~3.4× heavier* than raw because the reifier-metadata pattern adds 3 triple-pattern matches per result row (`rdf:reifies` + `author` + `timestamp`). |
| Rust orchestration (group + hydrate) | ~1.5 | |
| RPC + marshal | ~1.7 | |

The SPARQL emitted by `build_instance_sparql` for the Single-plan branch always selects `?source ?predicate ?target ?author ?timestamp` and joins each property row against its RDF 1.2 reifier metadata — unconditionally, so that hydration can compute `author` / `createdAt` / `updatedAt` and apply last-write-wins. The join adds 3–5× work *per row* over the raw SPARQL equivalent that selects only `?source ?value`.

#### What to push into SPARQL (and where it can land)

The current upstream stack ([#837](https://github.com/coasys/ad4m/pull/837), [#842](https://github.com/coasys/ad4m/pull/842), [#846](https://github.com/coasys/ad4m/pull/846)) pushes `WHERE` conditions into SPARQL — that has expanded the envelope substantially for filter pushdown. But the remaining ratios are not about `WHERE` evaluation; they're about three things the model-query orchestrator does unconditionally that the caller may not need. All three are reachable from the same family of PRs:

1. **Make the reifier-metadata join opt-in.** S16 shows it accounts for ~3.4× the per-row SPARQL cost on scan-all queries. Gate behind a `with_metadata: bool` (or "include keys" intersection with `{author, createdAt, updatedAt, timestamp}`) on `ModelQueryInput`. When omitted, emit:
    ```sparql
    SELECT ?source ?predicate ?target WHERE { conformance + where + ?source ?predicate ?target . }
    ```
    Drops the `?_reifier reifies + author + timestamp` triples entirely. Expected impact: ~10× → ~2× on scan-all queries.
2. **Skip the COUNT query unless the caller reads `total_count`.** Currently fired any time `sparql_pagination.is_some()`. ~0.12 ms per call on medium today (4–6 % of `sr_by_expression_limit1`'s budget) but unbounded as the perspective grows. Same shape as the aggregate work in [#846](https://github.com/coasys/ad4m/pull/846)'s scaffolded `build_aggregate_sparql` — wire `count` to fire only when requested.
3. **Collapse two-phase pagination into a single plan when the `WHERE` filter is already selective enough.** For `sr_by_expression_limit1`, the where clause restricts to exactly 1 row before ORDER BY — there's nothing for the timestamp probe to sort over, so phase 1 is wasted. Heuristic: if `WHERE` includes an equality on a flag/unique property, skip the timestamp probe and emit a Single plan with the property-filter `VALUES` clause. Saves ~0.16 ms per call (~6 % of the single-row case).

None of these are SPARQL-language extensions — they're orchestrator changes that *reduce* SPARQL work. Natural follow-up PR to [#846](https://github.com/coasys/ad4m/pull/846).

#### Re-scoped recommendations

Given the post-fix data:

| Original rank | Reality | What it actually means |
|---|---|---|
| #1 tag as `@HasOne` polymorphic | **Works** with canonical SHACL emission | Update flux's `SemanticRelationship` decorators to emit the canonical form — the executor's polymorphic-on-same-predicate path is fine |
| #2 `@BelongsTo` | Decorators exist; **runtime behaviour unverified** at scale | Bench before relying on it for any conversion (S16 follow-up case) |
| #3 Polymorphic `findAll` | Independent need | Reaffirmed |
| #4 Per-link reifier `meta:` | Confirmed AD4M-side need | Reaffirmed |
| #5 Nested `where` on relations | Decorator option exists; **runtime not benched** | Same caveat as #2 |
| #6 UNION across queries | Not blocking | Same |

Per-site verdict:

| Category | Original verdict | Bench-grounded verdict (post-fix) |
|---|---|---|
| A. Trivially convertible (5 sites) | "Slight perf regression, trade-off for type safety" | **Modest perf regression (5–10×).** Acceptable in isolation; problematic at scale. Worth converting *if* the three model_query orchestrator fixes above land first. |
| B. Convertible with new features (10 sites) | "Likely a perf win because it collapses N+1" | Plausibly a wash or win once the reifier-metadata join is opt-in. Need bench cases that drive multi-row hydration + `@BelongsTo` traversal (next S16 iteration). |
| C. Reifier-metadata reads (4 sites) | "Keep as SPARQL" | Reaffirmed |
| D. Set-difference (2 sites) | "Keep as SPARQL" | Reaffirmed |
| E. Inter-class joins (4 sites) | "Mixed" | Lean toward SPARQL until the orchestrator fixes are wired |

**Bottom line for this PR's stated goal — "convert flux raw SPARQL to Ad4mModel where possible":** the bench data argues against most conversions until the AD4M-side `model_query` layer's per-instance overhead is brought down. The right work isn't migrating call sites in flux — it's investigating *why* `findAll` is 14-150× slower than raw SPARQL even for a single-row lookup, and fixing it in `coasys/ad4m`. S16 will land as a regression gate against that work: any future `model_query` change can re-run it and watch the ratios collapse toward 1×.

---

## Why is `model_query` complex Rust at all? — single-SPARQL elegance audit

The remaining 5–25× gap (and the orchestrator overhead generally) comes from a fan-out pattern: one `perspective.modelQuery` RPC dispatches **1 + N + M + K SPARQL queries** through the same `SparqlEvaluator`, with most of the tree-shaping work happening between queries in Rust rather than inside SPARQL. This section enumerates every fan-out site, explains why each one exists, and proposes how it could collapse into either (a) a single SPARQL query or (b) a streaming subgraph extraction.

### Inventory: every `store.query` call site in `model_query`

(All counts at `dev`@`1f29d0b17`. "Why separate" = the reason it isn't already fused into the main instance query.)

| # | Phase | Site | Fires when | Cost in S16 | Why separate today |
|---|---|---|---:|---:|---|
| 1 | Shape resolution | `shape.rs:61, 116, 327, 340` | First-ever query for a class in this perspective | cold-miss only | Shape is cached `Arc<ModelShape>` per `(perspective, class)`; queries run *before* the main query because the SPARQL builder needs the shape. |
| 2 | Main instance — Single plan | `query.rs:187` | No `limit`/`offset` | 65 ms (`sr_all` med) | The main query. Where the bulk of work happens. |
| 3 | Main instance — TwoPhase phase 1 (pagination) | `query.rs:203` | `limit`/`offset` set | 0.16 ms (`sr_by_expr_limit1` med) | Need an `ORDER BY ?_first_ts` so the limit cuts the right rows. The timestamp probe joins reifier metadata; can't be combined with phase 2 because phase 2's `VALUES ?source` is *driven by* phase 1's `?source` bindings. |
| 4 | Main instance — TwoPhase phase 2 (properties) | `query.rs:236` | After phase 1 returns ≥1 source | 0.10 ms | Same reason — `VALUES ?source { … }` is the dynamic bridge between the two phases. |
| 5 | Total count | `query.rs:109` (fast path) / `query.rs:290` | `limit==0` OR `sparql_pagination.is_some()` | 0.12 ms | `COUNT(DISTINCT ?source)` needs aggregation; the planner can't fold it into a `SELECT` that also returns rows without grouping artefacts. **Fires unconditionally whenever a `limit` is set, even if the caller never reads `total_count`.** |
| 6 | Reverse relations (`@BelongsTo`) | `relations.rs:69` | shape has reverse-direction properties | varies per relation | Each reverse predicate runs its own batched `VALUES ?target { … } ?source <pred> ?target`. Could be fused via UNION but the planner pays for the extra branches. |
| 7 | Include sub-query (forward) | recursive `execute_model_query_inner` via `relations.rs:200` | `include: { rel: … }` | 0.74 ms (`@d1` med) | Forward includes call the whole pipeline recursively on the target class with `where: { id: [collected target IRIs] }`. **Each level of nesting fires its own 1–4 queries.** |
| 8 | Reverse include lookup | `relations.rs:297` | `include: { reverseRel: … }` | n/a in S16 (no `@BelongsTo`) | One `?source <pred> ?target` lookup to find the source IRIs, *then* a recursive `execute_model_query_inner` on those sources. **Doubles the round-trips of forward includes.** |
| 9 | ASK getters | `getters.rs:226` | shape has properties with `ASK { … }` getters | per-property | Each getter expression is translated to a batched `SELECT` with `VALUES ?source { … }`. Could lift into the main query as `BIND(EXISTS { … } AS ?<name>)` but the executor never tries. |
| 10 | SELECT getters | `getters.rs:255` | shape has properties with `SELECT { … }` getters | per-property | Each one fires its own batched `SELECT`. Lifting into the main query would need careful subquery composition. |
| 11 | Relation `where_filter` | `getters.rs:403` | shape relation has `where_filter` | per filter predicate | For each predicate in the filter, one batched `SELECT ?source ?val WHERE { VALUES ?source { … } ?source <pred> ?val }` — then Rust matches per-target. **N filter predicates → N round-trips.** |
| 12 | Projection (`count`) | `projection.rs:115` | `projections: { $foo: { count: true, … } }` | per projection | One `SELECT ?parent (COUNT(DISTINCT ?t) AS ?n) GROUP BY ?parent`. |
| 13 | Projection (`list`) | `projection.rs:159` | `projections: { $foo: { count: false, … } }` | per projection | One `SELECT ?parent ?t WHERE { … } ORDER BY … LIMIT …` per projection. If `target_class_name` is set, *also* recurses into `execute_model_query_inner`. |

Plus **one non-SPARQL fan-out:**

| # | Phase | Site | Fires when |
|---|---|---|---|
| 14 | `resolveLanguage` transforms | `query.rs:412` (`resolve_language_transforms`) | shape has properties with `resolve_language` set | One `LanguageController.get_expression(...)` Holochain RPC *per instance × per resolveLanguage prop*, **sequentially**. This is not SPARQL because the expression data lives outside the perspective. |

**Total round-trip count for a non-trivial `findAll`:**

- Cold first call: 1 shape query + 1–3 main + 1 count + R reverse + I include sub-queries + G getters + F filter predicates + P projections
- Warm: same minus the shape query
- For a query that hydrates 1 SR via `include: { embeddingTag: true }` on `dev` today: shape (warm cache) + 2 main (TwoPhase) + 1 count + 1 nested include (Embedding) = 4 SPARQL round-trips.
- For a query like `Conversation.findAll({ include: { subgroups: { include: { items: true, $topicCount: { count: true } } } } })`: ~10–15 round-trips per outer call.

This is the real reason `model_query` ratios don't collapse all the way to 1×. The SPARQL inside each query is fast; the **fan-out** is what costs.

### Why each fan-out exists — and what would let it collapse

Going site-by-site:

#### Reifier metadata (already covered above)

Unconditional join in the main instance query for `author` + `timestamp` + `rdf:reifies` triple. Cost: ~3.4× per-row SPARQL overhead on scan-all queries. Fix: gate on `with_metadata: bool` in `ModelQueryInput`. Easy, ~50 LOC PR.

#### COUNT fires unconditionally with pagination

Even when the caller doesn't use `total_count`, `query.rs:290` runs a separate `SELECT (COUNT(DISTINCT ?source) AS ?cnt) …`. Currently gated only on `sparql_pagination.is_some()`. Fix: thread a `count: bool` flag through `ModelQueryInput` and skip the query unless it's truthy *or* the caller explicitly asks for `total_count`. Easy, ~30 LOC PR.

#### TwoPhase plan when WHERE is already selective

`sr_by_expression_limit1` has `where: { expression: id }` which restricts to *exactly one row*. The TwoPhase plan still emits `ORDER BY ?_first_ts LIMIT 1` over a reifier-metadata-joined subquery — wasted work because there's nothing to sort. Fix: heuristic — when WHERE includes equality on a unique property (id, base, flag-target), skip the timestamp probe and emit Single with the equality `VALUES`. Medium, ~80 LOC PR with a new test.

#### Reverse relations + reverse includes — fused single SPARQL via UNION

A model with multiple `@BelongsTo` relations fires one batched lookup per reverse predicate. These can fuse into a single SPARQL with one `?source ?p ?target` row per matched edge:

```sparql
SELECT ?target ?predicate ?source WHERE {
  VALUES ?target { … instance IRIs … }
  VALUES ?predicate { <pred1> <pred2> … }
  ?source ?predicate ?target .
}
```

Then Rust splits by `?predicate` post-hoc. **Saves R-1 round-trips** for shapes with R reverse predicates. Easy, ~60 LOC PR.

#### Forward includes — collapse via SPARQL CONSTRUCT or subgraph extraction

This is the structurally interesting one. Today `include: { embeddingTag: true }` causes a *full pipeline recursion* on the target class — meaning the include's own SPARQL queries (main + count + maybe its own includes) fire as a separate fan-out. The recursion is what makes deep includes (`include: { a: { include: { b: { include: { c: true } } } } }`) blow up.

Two paths to fix:

a) **Lift the include into the main query**. Replace `?source ?predicate ?target` (returning IRIs) with a wider main query that also drags in target properties:
   ```sparql
   SELECT ?source ?predicate ?target ?author ?timestamp
          ?target_predicate ?target_value WHERE {
     # … conformance + where + property fetch as today …
     OPTIONAL {
       ?target ?target_predicate ?target_value .
       VALUES ?target_predicate { … target's predicates … }
     }
   }
   ```
   Then group + hydrate the target in the same pass. Works for shallow (depth-1) includes. Saves 1 SPARQL per included relation per level.

b) **Use SPARQL CONSTRUCT** to return the entire subgraph in one query, then re-shape the resulting triples into a JSON tree in Rust:
   ```sparql
   CONSTRUCT {
     ?source ?p ?o .
     ?source <ad4m:include/tag> ?tag .
     ?tag ?tp ?to .
   } WHERE {
     # main conformance + where + property fetch + include traversal
   }
   ```
   The CONSTRUCT returns a Graph (subset of triples); a generic `subgraph → tree` algorithm walks the shape and lifts it to JSON. Works for arbitrary depth. Single SPARQL round-trip regardless of include depth. This is the **elegant pipeline endpoint** — see "What the perfectly elegant pipeline looks like" below.

#### Getters lifted into the main SELECT

Today each getter — `ASK { … }` or `SELECT { … }` — fires its own batched-`VALUES` query. The transformation that's actually wanted:

- `ASK { ?source <flag-pred> <flag-value> }` getter → `BIND(EXISTS { ?source <flag-pred> <flag-value> } AS ?<getterName>)` inside the main SELECT
- `SELECT ?value WHERE { ?source <pred> ?value }` getter → `OPTIONAL { ?source <pred> ?<getterName> }` (or a subquery if the getter is multi-row)

Folding M getters into the main SELECT saves M round-trips. Medium-effort PR (need a getter→SPARQL-fragment compiler). Open question: does Oxigraph's planner cope well with many BIND/EXISTS clauses? Worth benching before committing.

#### Relation `where_filter` — push to SPARQL

`getters.rs:apply_where_filter_to_relation` is a textbook N+1 case: for each predicate in `where_filter`, fetch target's value, then filter targets in Rust. The SPARQL equivalent already exists — just push the filter clauses into the original include's WHERE block:

```sparql
?source <relPred> ?target .
?target <filterPred1> ?v1 . FILTER(?v1 = "X") .
?target <filterPred2> ?v2 . FILTER(?v2 > 5) .
```

Easy, ~100 LOC PR. Removes the entire `apply_where_filter_to_relation` helper.

#### Projections — fold into main as subqueries

Each projection key fires its own grouped SPARQL. SPARQL 1.1 supports subqueries with their own ORDER BY + LIMIT, so a projection can fold in as:

```sparql
SELECT ?source ?topicCount WHERE {
  # main conformance + where …
  {
    SELECT ?source (COUNT(DISTINCT ?t) AS ?topicCount) WHERE {
      ?source <topicPred> ?t .
    } GROUP BY ?source
  }
}
```

Saves P round-trips for queries with P projections. Medium PR.

#### resolveLanguage — the only path that genuinely can't be SPARQL

This calls `LanguageController.get_expression(lang, expr_addr)` which dispatches a Holochain RPC to fetch expression data from outside the perspective. **The data doesn't live in the RDF store; it lives in the language's Holochain cell.** No SPARQL extension can reach it.

But the orchestration *is* fixable:
- Today the implementation is sequential per-instance per-property (`query.rs:432–438` walks instances in a `for` loop, awaits each `controller.get_expression(...)` call).
- Could be batched: collect all (lang, expr_addr) pairs across all instances, fire them in parallel via `futures::join_all` or `tokio::spawn`-fan-out, then map results back.
- For repeated lookups in the same query, deduplicate by expression URL first.

This is the only correct "Rust orchestration" cost. Even there, parallelism would save 5–50× on workloads with many resolveLanguage properties.

### Post-hydration paths that can collapse

#### `matches_where` post-hydration filter (`filtering.rs:22`)

Used when `all_where_pushable` returns false. The remaining cases — after #842 / #846 — are: `Ops` conditions on getter-derived properties, and conditions on collection counts. The first can be pushed once getters are inlined (above). The second is a `HAVING` clause on a `GROUP BY ?source`.

#### Multi-key sort (`filtering.rs:sort_instances`)

The pagination plan only pushes the *first* sort key to SPARQL. Multi-key sort happens in Rust. SPARQL supports `ORDER BY key1 ASC, key2 DESC` natively — the limit is the `build_query_patterns` builder, not the language. Easy PR.

### Read into the original recommendations table — what's still open?

Quick audit of the six prioritised additions vs current state and what new evidence S16 surfaces:

| Rank | Recommendation | Status now | What S16 / profile data adds |
|---|---|---|---|
| #1 | `tag` as typed `@HasOne` polymorphic | **Works at the executor level** (s16 confirmed include fires for two `@HasOne` on the same predicate, conformance-discriminated). Open in flux: emit canonical SHACL in `SemanticRelationship`. | False alarm in v1 — the runtime path was always there; only flux's decorator emission was wrong (or wrong in the s16 mirror). Doc still flags it as flux-side work. |
| #2 | `@BelongsTo()` cleaner reverse-relation decorator | Decorators exist in `@coasys/ad4m`. Runtime behaviour benched only indirectly via include. | **Not yet covered by S16.** Next S16 case (`belongsto_traversal`) to add. |
| #3 | Multi-class polymorphic `findAll` | Not implemented. | Reaffirmed by `allItemEmbeddings()` (sites 22+23). |
| #4 | Per-link reifier metadata sidecar | Not implemented; today's metadata join is unconditional on **instance** rows but absent on **relation target** rows. | Profile data adds urgency — the unconditional metadata join is what makes scan-all queries 3.4× slower per row. Making it opt-in is the same fix from two angles. |
| #5 | Nested `where` on relations | Decorators exist (`where_filter` + `where_predicates` plumbed through SHACL parser → shape loader → `apply_where_filter_to_relation`). Runtime is N+1 SPARQL today (one query per filter predicate). | **Not benched.** Next S16 case (`relation_where_filter`) to add. Pushdown into main SPARQL is the elegant fix. |
| #6 | UNION across query shapes | Not blocking. | No change. |

**What was NOT in the original list and is now clearly open:**

7. **Opt-in reifier-metadata join** (orchestrator change, ~50 LOC). New from profile data.
8. **Opt-in `total_count`** (orchestrator change, ~30 LOC). New from profile data.
9. **Single-plan when WHERE is selective** (orchestrator change, ~80 LOC). New from profile data.
10. **Reverse-relation UNION fusion** (orchestrator change, ~60 LOC). Surfaced by inventory audit.
11. **Forward-include collapse via SPARQL CONSTRUCT or subgraph extraction** (the big one, ~500 LOC). Surfaced by inventory audit.
12. **Getter pushdown via `BIND(EXISTS {...})`** (medium PR, depends on Oxigraph planner behaviour). Surfaced by inventory audit.
13. **Relation `where_filter` pushdown** (~100 LOC). Surfaced by inventory audit.
14. **Projection inlining via SPARQL subqueries** (medium PR). Surfaced by inventory audit.
15. **Multi-key sort pushdown** (small PR). Surfaced by inventory audit.
16. **Parallel resolveLanguage batching** (~100 LOC, not SPARQL). Surfaced by inventory audit.
17. **JSON streaming or `Solutions` → `Value` direct** (small refactor in `sparql_store.rs:query`). Surfaced by inventory audit.

### What the perfectly elegant `Ad4mModel` → SPARQL pipeline looks like

The endpoint is a **single SPARQL CONSTRUCT round-trip per model query**, regardless of include depth or projection count. The orchestrator:

1. Walks the model's `ModelShape` and the query's `ModelQueryInput.include` to build a *single* SPARQL CONSTRUCT query that materialises the entire subgraph needed — instance triples, included relations, getters lifted into `BIND` / `EXISTS`, projections folded into subqueries, where-clauses inlined into the WHERE block.
2. Fires that one query against the store.
3. The store returns a graph of triples (Oxigraph supports this natively as `QueryResults::Graph`).
4. A `subgraph → tree` walker in Rust consumes the triples and emits the JSON tree the TS client wants, using the model's `ModelShape` as the schema for the walk.
5. If the shape has `resolve_language` properties, fire a parallel batched `LanguageController` fetch over all (lang, addr) pairs — *after* the SPARQL phase, but in a single concurrent batch.
6. Serialize the final tree once and ship over the WS RPC.

Round-trip count: **1 SPARQL + 1 batched RPC (if applicable)**, total — independent of N, M, K, include depth, or model complexity.

What this requires:

- **Subgraph CONSTRUCT planner in the model_query builder.** Rewrite `build_instance_sparql` to emit a CONSTRUCT that captures the entire requested tree. The shape + query input together determine which triples to materialise.
- **Tree-shape walker in hydration.** Replace `group_results_by_source` + `hydrate_instances` + `resolve_includes_recursive` with a single walker that takes the triple graph + shape and emits the JSON tree directly.
- **Streaming where possible.** Use Oxigraph's `QuerySolutionIter` directly rather than the current "materialise to JSON string, parse it back" round-trip in `sparql_store.rs:query`.
- **Holochain expression-resolution batching.** Add a `LanguageController::get_expressions_batch(pairs: Vec<(lang, addr)>) → HashMap<addr, ExprJson>` and use it in `resolve_language_transforms`.
- **Reified `?author` / `?timestamp` as opt-in `meta:` projections** (recommendation #4). Same fix as the opt-in reifier metadata above but applied recursively to relation target instances.

The result is a pipeline that:
- Hydrates one row in 1 round-trip (current: 3–4 round-trips).
- Hydrates a 3-deep include tree in 1 round-trip (current: ~10 round-trips).
- Doesn't pay reifier overhead unless the client asks for metadata.
- Doesn't pay COUNT overhead unless the client asks for total_count.
- Scales linearly with result-set size, not query-plan complexity.

Expected post-state in S16:

| Case | dev today (medium) | with all fixes | reason |
|---|---:|---:|---|
| `sr_by_expression_limit1` | 5.0× | ~1.5× | Drop count, single-plan, RPC roundtrip floor |
| `sr_by_expression_with_include` | 5.5× | ~1.5× | Same + include via CONSTRUCT subgraph |
| `sr_all` (no metadata requested) | 9.4× | ~2× | Drop reifier-metadata join |
| `embeddings_all` (no metadata) | 10.6× | ~2× | Same |
| `topics_all` | 25× | ~3× | Same; RPC floor dominates because raw is sub-ms |

### PR sequence to land it

Ordered by impact-per-LOC; each builds on the previous:

| PR | Scope | Effort | Expected ratio change |
|---|---|---|---|
| A. Opt-in reifier metadata | Add `with_metadata: bool` to `ModelQueryInput`, gate the `?_reifier reifies + author + timestamp` clauses in `build_instance_sparql`. | ~50 LOC + tests | 9–25× → ~2–3× on scan-all |
| B. Opt-in `total_count` | Add `count: bool`, gate the COUNT query. | ~30 LOC + tests | -0.1ms per call (small but free) |
| C. Single-plan when WHERE selective | Heuristic in `query.rs` to skip TwoPhase when WHERE includes equality on a unique property. | ~80 LOC + tests | 5× → 3.5× on `sr_by_expression_limit1` |
| D. Reverse-relation UNION fusion | Rewrite `resolve_reverse_relations` to emit one UNION SPARQL. | ~60 LOC + tests | -R round-trips per call |
| E. Multi-key sort pushdown | Extend `build_instance_sparql` to emit multi-key `ORDER BY`. | ~40 LOC + tests | Eliminates a Rust sort phase |
| F. Relation `where_filter` pushdown | Push `apply_where_filter_to_relation` into the include's SPARQL WHERE. | ~100 LOC + tests | -F round-trips |
| G. Getter inlining | Compile ASK getters into `BIND(EXISTS{…})`, SELECT getters into `OPTIONAL{…}` in main query. | ~200 LOC + tests | -G round-trips |
| H. Projection subquery inlining | Fold projections into main query as sub-SELECTs. | ~150 LOC + tests | -P round-trips |
| I. CONSTRUCT-based hydration | Replace the current SELECT + recursive include pipeline with a single CONSTRUCT + subgraph walker. | ~500 LOC + tests + reshape `hydration.rs` and `relations.rs` | Constant 1 round-trip regardless of include depth |
| J. Parallel resolveLanguage batching | Add batched `LanguageController::get_expressions_batch`, use in `resolve_language_transforms`. | ~100 LOC + Holochain plumbing | Eliminates N×k sequential `get_expression` await chain |
| K. Streaming Solutions → Value | Replace `sparql_store::query`'s "Solutions → String → from_str → Vec<Value>" with direct `Solutions → Vec<Value>`. | ~50 LOC + tests | -1 JSON parse round-trip per SPARQL call |

A through F are pure quick wins (~360 LOC across six small PRs). G through K are the structural rebuild. The investigation argues that A+B+C alone would close 60–80% of the S16 gap; G+I would close the rest.

Each PR adds (or extends) one S16 case so the regression gate sees the ratio collapse cleanly:

- A → s16 `embeddings_all_no_metadata`
- C → s16 `sr_by_expression_eq_no_orderby`
- D → s16 `multi_reverse_relations`
- F → s16 `relation_where_filter`
- G → s16 `class_with_ask_getter`
- H → s16 `class_with_projections`
- I → s16 `deep_include_3_levels`
