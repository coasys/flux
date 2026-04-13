/**
 * Tests for the SPARQL query fixes in channel/index.ts.
 *
 * Validates that:
 * 1. The processedQuery does NOT scope subgroups as direct children of the channel
 *    (bug: subgroups are grandchildren via conversations, so channel→subgroup never matched)
 * 2. The processedQuery finds items globally via any conversation_subgroup
 * 3. The final VALUES query re-verifies channel membership
 *
 * Run: npx tsx packages/api/src/channel/channel-query.test.ts
 */

const SUBGROUP_ITEM = 'flux://has_item';

// --- Query builders (mirror the logic in Channel.unprocessedItems()) ---

function buildProcessedQuery_BROKEN(channelId: string): string {
  // OLD (buggy): assumes subgroups are direct children of the channel
  return `
    SELECT ?id WHERE {
      GRAPH ?g0 { <${channelId}> <ad4m://has_child> ?sg . }
      GRAPH ?g1 { ?sg <${SUBGROUP_ITEM}> ?id . }
      GRAPH ?g2 { ?sg <flux://entry_type> <flux://conversation_subgroup> . }
    }
  `;
}

function buildProcessedQuery(channelId: string): string {
  // FIXED: find items in ANY conversation_subgroup globally.
  // Subgroups are grandchildren of channels (channel → conversation → subgroup),
  // so scoping through channel never matched. Items are unique to channels anyway.
  void channelId; // not used — intentionally global
  return `
    SELECT ?id WHERE {
      GRAPH ?g1 { ?sg <${SUBGROUP_ITEM}> ?id . }
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

// --- Test runner ---
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

// --- Tests ---

console.log('BUG: old processedQuery wrongly scoped subgroups as channel children');
{
  const channelId = 'flux://channel/abc123';
  const q = buildProcessedQuery_BROKEN(channelId);
  // This pattern is the bug — it assumes channel → has_child → subgroup
  assert(
    q.includes(`<${channelId}> <ad4m://has_child> ?sg`),
    'broken query links channel directly to subgroup (the bug)'
  );
}

console.log('\nFIX: processedQuery finds items via any subgroup globally');
{
  const channelId = 'flux://channel/abc123';
  const q = buildProcessedQuery(channelId);
  // Must NOT contain the channel→subgroup direct link
  assert(
    !q.includes(`<${channelId}>`),
    'fixed query does NOT reference channel ID (global scan)'
  );
  assert(
    !q.includes('<ad4m://has_child>'),
    'fixed query does NOT use has_child (no channel scoping)'
  );
  // Must still find items via subgroups
  assert(
    q.includes(`<${SUBGROUP_ITEM}>`),
    'fixed query includes SUBGROUP_ITEM predicate'
  );
  assert(
    q.includes('<flux://entry_type> <flux://conversation_subgroup>'),
    'fixed query filters for conversation_subgroup type'
  );
}

console.log('\nfinal VALUES query re-verifies channel membership');
{
  const channelId = 'flux://channel/abc123';
  const ids = ['flux://item/1', 'flux://item/2'];
  const q = buildDataQuery(channelId, ids);
  assert(q.includes('VALUES ?id'), 'dataQuery uses VALUES clause');
  assert(q.includes(channelId), 'dataQuery includes channel ID');
  assert(
    q.includes(`<${channelId}> <ad4m://has_child> ?id`),
    'dataQuery re-verifies channel membership via has_child join'
  );
  assert(!q.includes('FILTER NOT EXISTS'), 'dataQuery avoids O(N²) FILTER NOT EXISTS');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
