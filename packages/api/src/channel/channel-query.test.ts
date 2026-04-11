/**
 * Tests for the SPARQL query fixes in channel/index.ts.
 *
 * These validate that:
 * 1. The processedQuery is scoped to the channel (includes channel ID in the query)
 * 2. The final VALUES query re-verifies channel membership (includes channel join)
 *
 * Run: npx tsx packages/api/src/channel/channel-query.test.ts
 */

// Replicate the query construction logic from Channel.unprocessedItems()
// to validate SPARQL correctness without needing a full AD4M runtime.

function buildAllItemsQuery(channelId: string): string {
  return `
    SELECT ?id WHERE {
      GRAPH ?g1 { <${channelId}> <ad4m://has_child> ?id . }
      GRAPH ?g2 { ?id <flux://entry_type> ?type . }
      FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
    }
  `;
}

function buildProcessedQuery(channelId: string): string {
  return `
    SELECT ?id WHERE {
      GRAPH ?g0 { <${channelId}> <ad4m://has_child> ?sg . }
      GRAPH ?g1 { ?sg <${'flux://has_subgroup_item'}> ?id . }
      GRAPH ?g2 { ?sg <flux://entry_type> <flux://conversation_subgroup> . }
    }
  `;
}

function buildDataQuery(channelId: string, unprocessedIds: string[]): string {
  const valuesClause = unprocessedIds.map(id => `<${id}>`).join(' ');
  return `
    SELECT ?id ?author ?timestamp ?type ?body ?title ?taskName WHERE {
      VALUES ?id { ${valuesClause} }
      GRAPH ?link1 { <${channelId}> <ad4m://has_child> ?id . }
      ?link1 <ad4m://ontology/author> ?author .
      ?link1 <ad4m://ontology/timestamp> ?timestamp .
      GRAPH ?g2 { ?id <flux://entry_type> ?type . }
      FILTER(?type IN (<flux://has_message>, <flux://has_post>, <flux://has_task>))
      OPTIONAL { GRAPH ?g4 { ?id <flux://body> ?body . } }
      OPTIONAL { GRAPH ?g5 { ?id <flux://title> ?title . } }
      OPTIONAL { GRAPH ?g6 { ?id <flux://name> ?taskName . } }
    }
    ORDER BY ?timestamp
  `;
}

// --- Tests ---
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log('processedQuery scoped to channel');
{
  const channelId = 'flux://channel/abc123';
  const q = buildProcessedQuery(channelId);
  assert(q.includes(channelId), 'processedQuery includes channel ID');
  assert(q.includes('<ad4m://has_child>'), 'processedQuery joins via has_child from channel');
  assert(!q.includes('SELECT ?id WHERE {\n      GRAPH ?g1 { ?sg'), 'processedQuery is not a global scan — scoped via channel→subgroup');
  // Verify it starts from the channel, not from all subgroups globally
  assert(q.includes(`<${channelId}> <ad4m://has_child> ?sg`), 'processedQuery starts traversal from channel ID');
}

console.log('\nfinal VALUES query re-verifies channel membership');
{
  const channelId = 'flux://channel/abc123';
  const ids = ['flux://item/1', 'flux://item/2'];
  const q = buildDataQuery(channelId, ids);
  assert(q.includes('VALUES ?id'), 'dataQuery uses VALUES clause');
  assert(q.includes(channelId), 'dataQuery includes channel ID');
  assert(q.includes(`<${channelId}> <ad4m://has_child> ?id`), 'dataQuery re-verifies channel membership via has_child join');
  // This is the key fix: the final query doesn't just trust the item IDs,
  // it re-joins with the channel to confirm membership (race condition mitigation)
  assert(!q.includes('FILTER NOT EXISTS'), 'dataQuery avoids O(N²) FILTER NOT EXISTS');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
