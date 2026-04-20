/**
 * Tests for ChannelSummary — lightweight Channel model without @HasMany relations.
 *
 * Validates via source inspection:
 * 1. ChannelSummary has no @HasMany decorators (no getter/relation queries fire)
 * 2. ChannelSummary has expected @Property/@Flag decorators
 * 3. ChannelSummary does not import relation models (Message, Conversation, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';

const summaryPath = path.resolve(__dirname, 'ChannelSummary.ts');
let sourceCode: string;

beforeAll(() => {
  sourceCode = fs.readFileSync(summaryPath, 'utf-8');
});

describe('ChannelSummary (lightweight read model)', () => {
  // Strip comments to avoid false positives from doc text
  let codeOnly: string;
  beforeAll(() => {
    codeOnly = sourceCode
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('does NOT use @HasMany decorator', () => {
    expect(codeOnly).not.toContain('@HasMany');
  });

  it('does NOT import HasMany', () => {
    // Should not even import HasMany to prevent accidental usage
    const importLine = codeOnly.match(/import\s*{[^}]*}\s*from\s*'@coasys\/ad4m'/);
    expect(importLine).toBeTruthy();
    expect(importLine![0]).not.toContain('HasMany');
  });

  it('uses @Property for scalar properties', () => {
    expect(sourceCode).toContain('@Property({ through: ');
    // Should have name, description, isConversation, isPinned
    expect(sourceCode).toContain('CHANNEL_NAME');
    expect(sourceCode).toContain('CHANNEL_DESCRIPTION');
    expect(sourceCode).toContain('CHANNEL_IS_CONVERSATION');
    expect(sourceCode).toContain('CHANNEL_IS_PINNED');
  });

  it('uses @Flag for entry type', () => {
    expect(sourceCode).toContain('@Flag({');
    expect(sourceCode).toContain('ENTRY_TYPE');
  });

  it('uses @Model decorator with Channel name', () => {
    expect(sourceCode).toContain("@Model({ name: 'Channel' })");
  });

  it('extends Ad4mModel', () => {
    expect(sourceCode).toContain('extends Ad4mModel');
  });

  it('does NOT import any relation models (Message, Conversation, etc.)', () => {
    expect(sourceCode).not.toContain("import Message");
    expect(sourceCode).not.toContain("import Conversation");
    expect(sourceCode).not.toContain("import App");
    expect(sourceCode).not.toContain("import TaskBoard");
    expect(sourceCode).not.toContain("import Post");
  });
});
