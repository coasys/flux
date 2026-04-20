/**
 * Tests for useCommunityService — scoped queries and lightweight models.
 *
 * Validates:
 * 1. useCommunityService uses ChannelSummary (lightweight model) instead of Channel for allChannels
 * 2. getPinnedConversations uses Channel.pinnedConversations() (single SPARQL, not N+1)
 * 3. getRecentConversations uses Channel.recentConversations() (single SPARQL, not N+1)
 * 4. No iterative channel.get({ conversations: true }) loops remain
 *
 * These are static/structural tests that verify the code patterns.
 */

import * as fs from 'fs';
import * as path from 'path';

const composablePath = path.resolve(
  __dirname,
  '../../../../app/src/composables/useCommunityService.ts',
);

let sourceCode: string;

beforeAll(() => {
  sourceCode = fs.readFileSync(composablePath, 'utf-8');
});

describe('useCommunityService.ts (scoped queries)', () => {
  it('uses ChannelSummary for the allChannels live query', () => {
    expect(sourceCode).toContain('useLiveQuery(ChannelSummary, perspective)');
  });

  it('imports ChannelSummary from flux-api', () => {
    expect(sourceCode).toContain('ChannelSummary');
    expect(sourceCode).toContain("from '@coasys/flux-api'");
  });

  it('uses Channel.pinnedConversations() instead of iterative loop', () => {
    expect(sourceCode).toContain('Channel.pinnedConversations(perspective)');
  });

  it('uses Channel.recentConversations() instead of iterative loop', () => {
    expect(sourceCode).toContain('Channel.recentConversations(perspective');
  });

  it('does NOT use iterative channel.get({ conversations: true }) in getPinnedConversations', () => {
    // Extract the getPinnedConversations function body
    const pinnedMatch = sourceCode.match(
      /async function getPinnedConversations\(\)[\s\S]*?(?=\n  async function|\n  function|\n  \/\/.*\n  async)/,
    );
    expect(pinnedMatch).not.toBeNull();
    // Strip comments before checking — the old pattern may appear in comments
    const codeOnly = pinnedMatch![0].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codeOnly).not.toContain('channel.get({ conversations: true })');
    expect(codeOnly).not.toContain('.map(async (channel: Channel)');
  });

  it('does NOT use iterative channel.get({ conversations: true }) in getRecentConversations', () => {
    // Extract the getRecentConversations function body
    const recentMatch = sourceCode.match(
      /async function getRecentConversations\(\)[\s\S]*?(?=\n  async function|\n  function|\n  \/\/.*\n  async)/,
    );
    expect(recentMatch).not.toBeNull();
    // Strip comments before checking — the old pattern may appear in comments
    const codeOnly = recentMatch![0].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codeOnly).not.toContain('channel.get({ conversations: true })');
    expect(codeOnly).not.toContain('.map(async (channel: Channel)');
  });

  it('does NOT contain N+1 conversation/subgroup/items walk', () => {
    // The old getRecentConversations had: conversation.subgroups() -> lastSubgroup.itemsData()
    expect(sourceCode).not.toContain('conversation.subgroups()');
    expect(sourceCode).not.toContain('lastSubgroup.itemsData()');
  });

  it('allChannels type is ChannelSummary[], not Channel[]', () => {
    expect(sourceCode).toContain('allChannels: Ref<ChannelSummary[]>');
    expect(sourceCode).not.toContain('allChannels: Ref<Channel[]>');
  });
});
