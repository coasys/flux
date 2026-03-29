/**
 * Utilities for working with clean route URLs
 * Strips/restores protocol prefixes for neighbourhood URLs and channel IDs
 */

// Strips neighbourhood URL prefix to get clean community ID
export function stripNeighbourhoodPrefix(neighbourhoodUrl: string): string {
  const prefix = 'neighbourhood://';
  return neighbourhoodUrl.startsWith(prefix) ? neighbourhoodUrl.slice(prefix.length) : neighbourhoodUrl;
}

// Restores neighbourhood URL prefix from clean community ID
export function restoreNeighbourhoodPrefix(communityId: string): string {
  return `neighbourhood://${communityId}`;
}

// Strips literal:string: prefix from channel ID (handles both literal:// and literal: formats)
export function stripChannelPrefix(channelId: string): string {
  if (channelId.startsWith('literal://string:')) return channelId.slice('literal://string:'.length);
  if (channelId.startsWith('literal:string:')) return channelId.slice('literal:string:'.length);
  return channelId;
}

// Restores literal:string: prefix to channel ID
export function restoreChannelPrefix(channelId: string): string {
  return `literal:string:${channelId}`;
}
