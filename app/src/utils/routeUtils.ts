/**
 * Utilities for working with clean route URLs
 * Strips/restores protocol prefixes for neighbourhood URLs and channel IDs
 */

// Strips neighbourhood URL prefix to get clean community ID
export function stripNeighbourhoodPrefix(neighbourhoodUrl: string): string {
  const prefix = 'neighbourhood://';
  const privatePrefix = 'private://';
  if (neighbourhoodUrl.startsWith(prefix)) return neighbourhoodUrl.slice(prefix.length);
  if (neighbourhoodUrl.startsWith(privatePrefix)) return neighbourhoodUrl.slice(privatePrefix.length);
  return neighbourhoodUrl;
}

// Restores neighbourhood URL prefix from clean community ID
export function restoreNeighbourhoodPrefix(communityId: string): string {
  // If the communityId already has a protocol prefix, return as-is
  if (communityId.includes('://')) return communityId;
  return `neighbourhood://${communityId}`;
}

// Strips literal:string: prefix from channel ID
export function stripChannelPrefix(channelId: string): string {
  if (channelId.startsWith('literal:string:')) return channelId.slice('literal:string:'.length);
  return channelId;
}

// Restores literal:string: prefix to channel ID
export function restoreChannelPrefix(channelId: string): string {
  return `literal:string:${channelId}`;
}
