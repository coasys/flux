export const icons = { Message: 'chat', Post: 'postcard', Task: 'kanban' };
export const groupingOptions = ['Conversations', 'Subgroups', 'Items'] as const;
export const itemTypeOptions = ['All Types', 'Messages', 'Posts', 'Tasks'] as const;

export type GroupingOption = (typeof groupingOptions)[number];
export type ItemTypeOption = (typeof itemTypeOptions)[number];
export type ItemType = 'Message' | 'Post' | 'Task';
export type SearchType = '' | 'vector' | 'topic';
export type BlockType = 'conversation' | 'subgroup' | 'item';
export type FilterSettings = { grouping: GroupingOption; itemType: ItemTypeOption; includeChannel: boolean };
export type MatchIndexes = { conversation: number | undefined; subgroup: number | undefined; item: number | undefined };
export type Link = { source: string; predicate: string; target: string };
export type LinkExpression = { author: string; data: Link };

export class SynergyGroup {
  // Used for conversations & subgroups
  id: string;
  name: string;
  summary: string;
  timestamp: string;
  index?: number;
  parentIndex?: number;
  end?: number;
  start?: number;
}

export class SynergyItem {
  // Used for items: messages, posts, & tasks
  id: string;
  author: string;
  type: ItemType;
  icon: string;
  timestamp: string;
  text: string;
  index?: number;
  blockType?: string;
}

export class SynergyMatch {
  id: string;
  channelId: string;
  channelName: string;
  type: string;
  score?: number;
  relevance?: number;
  embedding?: number[];
}

export class SynergyTopic {
  id: string;
  name: string;
}

export function detectBrowser(): string {
  if (typeof (window as any).InstallTrigger !== 'undefined') return 'firefox';
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return 'safari';
  if (navigator.userAgent.includes('Edg')) return 'edge';
  if ((navigator as any)?.brave?.isBrave) return 'brave';
  // check chrome last as edge & brave are chromium based so would pass as chrome with the following logic
  if ((window as any).chrome && navigator.vendor === 'Google Inc.') return 'chrome';
  return 'unknown';
}
