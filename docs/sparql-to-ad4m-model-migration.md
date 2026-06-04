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
