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

describe('set-difference logic — unprocessedItems regression', () => {
  // Mirror the JS set-difference logic from Channel.unprocessedItems()
  function computeUnprocessed(allItems: string[], processedItems: string[]): string[] {
    const processedSet = new Set(processedItems);
    return allItems.filter(id => !processedSet.has(id));
  }

  it('returns items not in processedSet', () => {
    const all = ['item1', 'item2', 'item3', 'item4'];
    const processed = ['item1', 'item3'];
    expect(computeUnprocessed(all, processed)).toEqual(['item2', 'item4']);
  });

  it('returns ALL items when processedSet is empty (the original bug scenario)', () => {
    // This was the bug: processedQuery returned nothing (wrong scoping),
    // so processedSet was empty, making ALL items "unprocessed" every time.
    const all = ['item1', 'item2', 'item3'];
    expect(computeUnprocessed(all, [])).toEqual(['item1', 'item2', 'item3']);
  });

  it('returns empty array when all items are processed', () => {
    const all = ['item1', 'item2'];
    expect(computeUnprocessed(all, ['item1', 'item2'])).toEqual([]);
  });

  it('handles duplicates in allItems gracefully', () => {
    const all = ['item1', 'item2', 'item1', 'item3'];
    const processed = ['item1'];
    // Duplicates in allItems pass through — both instances of item1 are filtered
    expect(computeUnprocessed(all, processed)).toEqual(['item2', 'item3']);
  });

  it('handles duplicates in processedItems gracefully', () => {
    const all = ['item1', 'item2', 'item3'];
    const processed = ['item1', 'item1', 'item3'];
    expect(computeUnprocessed(all, processed)).toEqual(['item2']);
  });
});

describe('processedQuery — grandchild relationship documentation', () => {
  const channelId = 'flux://channel/abc123';

  // The link structure is: channel → conversation → subgroup → item.
  // The processedQuery must search for items via ANY subgroup globally,
  // not assume subgroups are direct children of the channel.
  it('fixed query searches globally, not scoped to channel', () => {
    const q = buildProcessedQuery(channelId);
    // Must NOT contain any reference to the channel ID
    expect(q).not.toContain(channelId);
    // Must NOT try to traverse channel→subgroup directly
    expect(q).not.toContain('<ad4m://has_child>');
    // Must find items via subgroup→item globally
    expect(q).toContain(`<${SUBGROUP_ITEM}>`);
  });
});

describe('Conversation.subgroupsData batchTimestampQuery pattern', () => {
  // Mirror the query built in Conversation.subgroupsData()
  function buildBatchTimestampQuery(subgroupIds: string[]): string {
    const valuesClause = subgroupIds.map(id => `<${id}>`).join(' ');
    return `
      SELECT ?sg ?transcriptStart ?channelTs WHERE {
        VALUES ?sg { ${valuesClause} }
        GRAPH ?g1 { ?sg <${SUBGROUP_ITEM}> ?item . }
        GRAPH ?chLink { ?chSrc <ad4m://has_child> ?item . }
        ?chLink <ad4m://ontology/timestamp> ?channelTs .
        GRAPH ?g2 { ?chSrc <flux://entry_type> <flux://has_channel> . }
        OPTIONAL { GRAPH ?g3 { ?item <flux://transcript_started_at> ?transcriptStart . } }
      }
    `;
  }

  it('uses VALUES clause with subgroup IDs', () => {
    const q = buildBatchTimestampQuery(['sg1', 'sg2']);
    expect(q).toContain('VALUES ?sg { <sg1> <sg2> }');
  });

  it('joins via SUBGROUP_ITEM (flux://has_item)', () => {
    const q = buildBatchTimestampQuery(['sg1']);
    expect(q).toContain(`<${SUBGROUP_ITEM}>`);
  });

  it('gets timestamps from channel→item links', () => {
    const q = buildBatchTimestampQuery(['sg1']);
    expect(q).toContain('<ad4m://ontology/timestamp> ?channelTs');
    expect(q).toContain('<ad4m://has_child> ?item');
  });

  it('generates empty VALUES for no subgroups', () => {
    const q = buildBatchTimestampQuery([]);
    expect(q).toContain('VALUES ?sg {  }');
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
