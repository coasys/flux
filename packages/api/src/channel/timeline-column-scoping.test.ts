/**
 * Tests for TimelineColumn — scoped subscriptions replacing raw listeners.
 *
 * Validates:
 * 1. TimelineColumn.vue no longer uses perspective.addListener('link-added', ...)
 * 2. handleLinkAdded, getDataFull, getDataIncremental are fully removed
 * 3. useLiveQuery with parent scope is used instead
 *
 * These are static/structural tests that verify the code patterns, not runtime tests.
 * (Runtime component testing would require a full Vue test harness with mocked AD4M.)
 */

import * as fs from 'fs';
import * as path from 'path';

// Read the source file
const timelineColumnPath = path.resolve(
  __dirname,
  '../../../../app/src/components/conversation/timeline/TimelineColumn.vue',
);

let sourceCode: string;

beforeAll(() => {
  sourceCode = fs.readFileSync(timelineColumnPath, 'utf-8');
});

describe('TimelineColumn.vue (scoped subscriptions)', () => {
  // Helper: strip comments from source to avoid false positives from
  // comment text describing scoped subscription replacing raw listeners
  let executableCode: string;
  beforeAll(() => {
    executableCode = sourceCode
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
  });

  it('does NOT use perspective.addListener("link-added", ...)', () => {
    expect(executableCode).not.toContain("perspective.addListener('link-added'");
    expect(executableCode).not.toContain('perspective.addListener("link-added"');
  });

  it('does NOT use perspective.removeListener("link-added", ...)', () => {
    expect(executableCode).not.toContain("perspective.removeListener('link-added'");
    expect(executableCode).not.toContain('perspective.removeListener("link-added"');
  });

  it('does NOT define handleLinkAdded function', () => {
    expect(executableCode).not.toContain('function handleLinkAdded');
  });

  it('does NOT define getDataFull function', () => {
    expect(executableCode).not.toContain('function getDataFull');
  });

  it('does NOT define getDataIncremental function', () => {
    expect(executableCode).not.toContain('function getDataIncremental');
  });

  it('does NOT use LINK_ADDED_TIMEOUT debounce pattern', () => {
    expect(executableCode).not.toContain('LINK_ADDED_TIMEOUT');
    expect(executableCode).not.toContain('linkAddedTimeout');
    expect(executableCode).not.toContain('linkUpdatesQueued');
  });

  it('uses useLiveQuery with parent scope for conversations', () => {
    expect(sourceCode).toContain('useLiveQuery(Conversation, perspective');
    expect(sourceCode).toContain('parent: { model: Channel, id: channelUrl }');
  });

  it('imports useLiveQuery from @coasys/ad4m-vue-hooks', () => {
    expect(sourceCode).toContain("import { useLiveQuery } from '@coasys/ad4m-vue-hooks'");
  });

  it('does NOT import onUnmounted (no manual cleanup needed)', () => {
    // useLiveQuery handles its own cleanup via onUnmounted internally
    // The component should no longer need its own onUnmounted for listener removal
    expect(sourceCode).not.toMatch(/import\s*{[^}]*onUnmounted[^}]*}\s*from\s*'vue'/);
  });

  it('uses watch on conversationInstances for reactive updates', () => {
    expect(sourceCode).toContain('watch(conversationInstances');
  });
});
