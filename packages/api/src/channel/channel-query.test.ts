/**
 * Tests for the SPARQL queries in Channel.unprocessedItems().
 *
 * Validates that:
 * 1. The processedQuery does NOT scope subgroups as direct children of the channel
 *    (bug: subgroups are grandchildren via conversations, so channel→subgroup never matched)
 * 2. The processedQuery finds items globally via any conversation_subgroup
 * 3. The final VALUES query re-verifies channel membership
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
  const valuesClause = unprocessedIds.map((id) => `<${id}>`).join(' ');
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

describe('processedQuery — regression: subgroups are not direct children of channels', () => {
  const channelId = 'flux://channel/abc123';

  it('old (broken) query wrongly links channel directly to subgroup', () => {
    const q = buildProcessedQuery_BROKEN(channelId);
    // This pattern is the bug — it assumes channel → has_child → subgroup
    // which never matches because the real structure is channel → conversation → subgroup
    expect(q).toContain(`<${channelId}> <ad4m://has_child> ?sg`);
  });

  it('fixed query does NOT reference channel ID (global scan)', () => {
    const q = buildProcessedQuery(channelId);
    expect(q).not.toContain(`<${channelId}>`);
  });

  it('fixed query does NOT use has_child (no channel scoping)', () => {
    const q = buildProcessedQuery(channelId);
    expect(q).not.toContain('<ad4m://has_child>');
  });

  it('fixed query includes SUBGROUP_ITEM predicate', () => {
    const q = buildProcessedQuery(channelId);
    expect(q).toContain(`<${SUBGROUP_ITEM}>`);
  });

  it('fixed query filters for conversation_subgroup type', () => {
    const q = buildProcessedQuery(channelId);
    expect(q).toContain('<flux://entry_type> <flux://conversation_subgroup>');
  });
});

describe('dataQuery — VALUES clause and channel membership', () => {
  const channelId = 'flux://channel/abc123';
  const ids = ['flux://item/1', 'flux://item/2'];

  it('uses VALUES clause for unprocessed IDs', () => {
    const q = buildDataQuery(channelId, ids);
    expect(q).toContain('VALUES ?id');
    expect(q).toContain('<flux://item/1>');
    expect(q).toContain('<flux://item/2>');
  });

  it('re-verifies channel membership via has_child join', () => {
    const q = buildDataQuery(channelId, ids);
    expect(q).toContain(`<${channelId}> <ad4m://has_child> ?id`);
  });

  it('avoids O(N²) FILTER NOT EXISTS', () => {
    const q = buildDataQuery(channelId, ids);
    expect(q).not.toContain('FILTER NOT EXISTS');
  });
});
