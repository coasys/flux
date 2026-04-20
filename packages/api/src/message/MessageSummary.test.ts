/**
 * Tests for MessageSummary — lightweight Message model without SPARQL getters.
 *
 * Validates via source inspection:
 * 1. MessageSummary does NOT have SPARQL getter properties (replyingTo, isPopular)
 * 2. MessageSummary retains simple @HasMany relations (reactions, thread, replies)
 * 3. No `getter:` SPARQL strings appear in the source
 */

import * as fs from 'fs';
import * as path from 'path';

const summaryPath = path.resolve(__dirname, 'MessageSummary.ts');
let sourceCode: string;

beforeAll(() => {
  sourceCode = fs.readFileSync(summaryPath, 'utf-8');
});

describe('MessageSummary (lightweight read model)', () => {
  // Strip comments to avoid false positives from doc text
  let codeOnly: string;
  beforeAll(() => {
    codeOnly = sourceCode
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('does NOT have a replyingTo property', () => {
    expect(codeOnly).not.toContain('replyingTo');
  });

  it('does NOT have an isPopular property', () => {
    expect(codeOnly).not.toContain('isPopular');
  });

  it('does NOT contain any SPARQL getter strings', () => {
    expect(codeOnly).not.toContain('getter:');
    expect(codeOnly).not.toContain('SELECT ?target WHERE');
    expect(codeOnly).not.toContain('ASK WHERE');
  });

  it('retains @HasMany for simple relations', () => {
    expect(sourceCode).toContain('@HasMany');
    expect(sourceCode).toContain('REACTION');
    expect(sourceCode).toContain('MESSAGE_THREAD');
    expect(sourceCode).toContain('HAS_REPLY');
  });

  it('has body @Property', () => {
    expect(sourceCode).toContain('@Property({ through: BODY })');
    expect(sourceCode).toContain('body: string');
  });

  it('uses @Model decorator with Message name', () => {
    expect(sourceCode).toContain("@Model({ name: 'Message' })");
  });

  it('extends Ad4mModel', () => {
    expect(sourceCode).toContain('extends Ad4mModel');
  });
});
