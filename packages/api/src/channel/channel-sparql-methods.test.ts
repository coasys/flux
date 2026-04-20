/**
 * Tests for Channel.recentConversations() and Channel.pinnedConversations()
 * — single SPARQL queries replacing N+1 graph walks.
 *
 * Validates via source inspection:
 * 1. recentConversations() static method exists and uses single SPARQL query
 * 2. pinnedConversations() static method exists and uses single SPARQL query
 * 3. Both methods use SPARQL with the correct predicates
 * 4. Both methods include error handling
 */

import * as fs from 'fs';
import * as path from 'path';

const channelPath = path.resolve(__dirname, 'index.ts');
let sourceCode: string;

beforeAll(() => {
  sourceCode = fs.readFileSync(channelPath, 'utf-8');
});

describe('Channel.recentConversations()', () => {
  it('defines a static async recentConversations method', () => {
    expect(sourceCode).toContain('static async recentConversations(');
  });

  it('accepts perspective and limit parameters', () => {
    expect(sourceCode).toMatch(/static async recentConversations\(\s*perspective:\s*PerspectiveProxy/);
    expect(sourceCode).toMatch(/limit:\s*number\s*=\s*\d+/);
  });

  it('returns array of { channelId, conversationId?, lastActivity? }', () => {
    // Check the return type shape
    expect(sourceCode).toContain('channelId: string; conversationId?: string; lastActivity?: string');
  });

  it('uses a single SPARQL query with SELECT', () => {
    // Extract the method body
    const match = sourceCode.match(
      /static async recentConversations[\s\S]*?(?=\n  \/\*\*|\n  static async pinnedConversations)/,
    );
    expect(match).toBeTruthy();
    const methodBody = match![0];

    // Should contain exactly one querySparql call
    const queryCalls = (methodBody.match(/perspective\.querySparql/g) || []).length;
    expect(queryCalls).toBe(1);

    // Should contain SELECT
    expect(methodBody).toContain('SELECT ?channelId');
  });

  it('includes LIMIT in the SPARQL query', () => {
    const match = sourceCode.match(
      /static async recentConversations[\s\S]*?(?=\n  \/\*\*|\n  static async pinnedConversations)/,
    );
    expect(match![0]).toContain('LIMIT');
  });

  it('includes ORDER BY DESC for sorting', () => {
    const match = sourceCode.match(
      /static async recentConversations[\s\S]*?(?=\n  \/\*\*|\n  static async pinnedConversations)/,
    );
    expect(match![0]).toContain('ORDER BY DESC');
  });

  it('deduplicates results by channelId', () => {
    const match = sourceCode.match(
      /static async recentConversations[\s\S]*?(?=\n  \/\*\*|\n  static async pinnedConversations)/,
    );
    const methodBody = match![0];
    // Should use Map or Set for deduplication
    expect(methodBody).toMatch(/seen\.(has|get)\(cid\)/);
  });

  it('handles errors and returns empty array', () => {
    const match = sourceCode.match(
      /static async recentConversations[\s\S]*?(?=\n  \/\*\*|\n  static async pinnedConversations)/,
    );
    const methodBody = match![0];
    expect(methodBody).toContain('catch (error)');
    expect(methodBody).toContain('return []');
  });

  it('does NOT iterate over channels (no for loop or .map with get())', () => {
    const match = sourceCode.match(
      /static async recentConversations[\s\S]*?(?=\n  \/\*\*|\n  static async pinnedConversations)/,
    );
    const methodBody = match![0];
    expect(methodBody).not.toContain('.get({ conversations');
    expect(methodBody).not.toContain('for (const channel');
    expect(methodBody).not.toContain('.map(async (channel');
  });
});

describe('Channel.pinnedConversations()', () => {
  it('defines a static async pinnedConversations method', () => {
    expect(sourceCode).toContain('static async pinnedConversations(');
  });

  it('accepts perspective parameter', () => {
    expect(sourceCode).toMatch(/static async pinnedConversations\(\s*perspective:\s*PerspectiveProxy/);
  });

  it('uses a single SPARQL query with SELECT', () => {
    const match = sourceCode.match(
      /static async pinnedConversations[\s\S]*?(?=\n  conversationsData\(\)|$)/,
    );
    expect(match).toBeTruthy();
    const methodBody = match![0];

    const queryCalls = (methodBody.match(/perspective\.querySparql/g) || []).length;
    expect(queryCalls).toBe(1);

    expect(methodBody).toContain('SELECT ?channelId');
  });

  it('filters for pinned channels in SPARQL', () => {
    const match = sourceCode.match(
      /static async pinnedConversations[\s\S]*?(?=\n  conversationsData\(\)|$)/,
    );
    const methodBody = match![0];
    expect(methodBody).toContain('CHANNEL_IS_PINNED');
    expect(methodBody).toContain('"true"');
  });

  it('deduplicates results by channelId', () => {
    const match = sourceCode.match(
      /static async pinnedConversations[\s\S]*?(?=\n  conversationsData\(\)|$)/,
    );
    const methodBody = match![0];
    expect(methodBody).toMatch(/seen\.(has|get)\(cid\)/);
  });

  it('handles errors and returns empty array', () => {
    const match = sourceCode.match(
      /static async pinnedConversations[\s\S]*?(?=\n  conversationsData\(\)|$)/,
    );
    const methodBody = match![0];
    expect(methodBody).toContain('catch (error)');
    expect(methodBody).toContain('return []');
  });
});
