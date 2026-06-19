#!/usr/bin/env -S npx tsx
/**
 * Side-by-side bench template: raw SPARQL vs `Ad4mModel.findAll({ include })`.
 *
 * **Status: scaffolded, not yet runnable.** The seed function and the
 * connection helper are stubs; expect ~200 lines of additional work to
 * wire up against a live executor + multi-user JWT. The skeleton is
 * committed so subsequent conversion PRs can fill it in incrementally
 * without re-deriving the shape.
 *
 * Intent: empirical grounding for the per-site convert-vs-keep decisions in
 * `docs/sparql-to-ad4m-model-migration.md`. The wind-tunnel scenarios in
 * `coasys/ad4m-wind-tunnel` are a heavier alternative and would need to
 * cross-import flux's api package, which they currently don't.
 *
 * Planned bench cases (one per row in the eventual results table):
 *
 *   1. `SR.itemEmbedding(itemId)`         (1 row)
 *   2. `SR.allConversationEmbeddings()`   (~N rows; needs @BelongsTo)
 *   3. `SR.allSubgroupEmbeddings()`       (~N rows; needs @BelongsTo)
 *   4. `SR.allItemEmbeddings()`           (~3N rows; needs polymorphic findAll)
 *   5. `Topic.linkedConversations()`      (~M rows; needs @BelongsTo)
 *   6. `Conversation.topics()`            (~K rows; needs UNION or two findAlls)
 *
 * For each: connect → seed at scale `N` → warm up → time `RUNS` invocations
 * → emit a markdown row. Output is appended to the PR doc's "Bench results"
 * section.
 *
 * Usage (once the seed is implemented):
 *   AD4M_URL=ws://127.0.0.1:12000/graphql AD4M_TOKEN=<jwt> \
 *     BENCH_SCALE=100 BENCH_RUNS=5 \
 *     npx tsx scripts/bench-sparql-vs-ad4m.ts
 */

import { Ad4mClient } from '@coasys/ad4m';

// const URL = process.env.AD4M_URL ?? 'ws://127.0.0.1:12000/graphql';
// const TOKEN = process.env.AD4M_TOKEN ?? '';
// const SCALE = Number(process.env.BENCH_SCALE ?? '100');
// const RUNS = Number(process.env.BENCH_RUNS ?? '5');

async function timeIt(label: string, fn: () => Promise<void>, runs: number): Promise<{ mean: number; p50: number }> {
  await fn(); // warm-up
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const p50 = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  console.log(`${label.padEnd(40)} mean=${mean.toFixed(2)}ms p50=${p50.toFixed(2)}ms (${runs} runs)`);
  return { mean, p50 };
}

// TODO: implement
//   - newClient(): construct an Ad4mClient pointed at AD4M_URL with the
//     multi-user JWT in connectionParams. See packages/api/src/embedding
//     tests for a working WS+Apollo setup.
//   - seed(client, perspectiveId, n): create n Items + Embeddings + Topics
//     + SRs spread across n/10 Conversations + Subgroups. Returns the IDs.
//   - main(): orchestrate; ensure subject classes registered; pick a sample
//     item; call each bench case; emit a markdown table.

console.error('bench harness scaffold only — see TODOs in source');
process.exit(2);
