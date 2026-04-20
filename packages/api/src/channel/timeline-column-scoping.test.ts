/**
 * Tests for TimelineColumn — scoped subscriptions replacing raw listeners.
 *
 * Validates:
 * 1. TimelineColumn.vue no longer uses perspective.addListener('link-added', ...)
 * 2. handleLinkAdded, getDataFull, getDataIncremental are fully removed
 * 3. useLiveQuery with parent scope is used instead
 * 4. refreshAllData and refreshTrigger are fully removed
 * 5. Reactive watchEffect/computed replaces imperative refresh
 *
 * These are static/structural tests that verify the code patterns, not runtime tests.
 * (Runtime component testing would require a full Vue test harness with mocked AD4M.)
 */

import * as fs from 'fs';
import * as path from 'path';

// Read source files
const timelineColumnPath = path.resolve(
  __dirname,
  '../../../../app/src/components/conversation/timeline/TimelineColumn.vue',
);
const timelineBlockPath = path.resolve(
  __dirname,
  '../../../../app/src/components/conversation/timeline/TimelineBlock.vue',
);

let sourceCode: string;
let blockSourceCode: string;

beforeAll(() => {
  sourceCode = fs.readFileSync(timelineColumnPath, 'utf-8');
  blockSourceCode = fs.readFileSync(timelineBlockPath, 'utf-8');
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

  it('does NOT import onMounted (reactive data flows replace imperative init)', () => {
    expect(sourceCode).not.toMatch(/import\s*{[^}]*onMounted[^}]*}\s*from\s*'vue'/);
  });
});

describe('TimelineColumn.vue (reactive data — no refreshAllData)', () => {
  let executableCode: string;
  beforeAll(() => {
    executableCode = sourceCode
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
  });

  it('does NOT define refreshAllData function', () => {
    expect(executableCode).not.toContain('function refreshAllData');
  });

  it('does NOT define getConversations function', () => {
    expect(executableCode).not.toContain('function getConversations');
  });

  it('does NOT define getUnprocessedItems function', () => {
    expect(executableCode).not.toContain('function getUnprocessedItems');
  });

  it('does NOT have refreshInFlight or refreshPending state', () => {
    expect(executableCode).not.toContain('refreshInFlight');
    expect(executableCode).not.toContain('refreshPending');
  });

  it('does NOT have refreshTrigger ref', () => {
    expect(executableCode).not.toContain('refreshTrigger');
  });

  it('does NOT pass refreshTrigger to TimelineBlock in template', () => {
    expect(sourceCode).not.toContain(':refresh-trigger');
  });

  it('uses watchEffect for reactive conversation mapping', () => {
    expect(sourceCode).toContain('watchEffect');
    expect(sourceCode).toContain('conversationInstances.value');
  });

  it('imports watchEffect from vue', () => {
    expect(sourceCode).toMatch(/import\s*{[^}]*watchEffect[^}]*}\s*from\s*'vue'/);
  });
});

describe('TimelineBlock.vue (no refreshTrigger dependency)', () => {
  let blockExecutableCode: string;
  beforeAll(() => {
    blockExecutableCode = blockSourceCode
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
  });

  it('does NOT accept refreshTrigger prop', () => {
    expect(blockExecutableCode).not.toContain('refreshTrigger');
  });

  it('does NOT pass refresh-trigger to child TimelineBlocks', () => {
    expect(blockSourceCode).not.toContain(':refresh-trigger');
  });
});
