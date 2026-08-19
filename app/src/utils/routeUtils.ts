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
  if (!communityId) return '';
  // If the communityId already has a protocol prefix, return as-is
  if (communityId.includes('://')) return communityId;
  return `neighbourhood://${communityId}`;
}

// Strips the legacy literal:string: prefix from a channel ID for use in route params.
// New ad4m://obj/ IDs pass through unchanged — they round-trip via restoreChannelPrefix
// which detects the :// scheme and returns them as-is.
export function stripChannelPrefix(channelId: string): string {
  if (channelId.startsWith('literal:string:')) return channelId.slice('literal:string:'.length);
  return channelId;
}

// Restores the instance-ID prefix from a clean route param.
// IDs that already carry a scheme (ad4m://, literal:, neighbourhood://) pass through unchanged.
// Bare IDs get the legacy literal:string: prefix for backwards compatibility.
export function restoreChannelPrefix(channelId: string): string {
  if (channelId.includes('://')) return channelId;
  return `literal:string:${channelId}`;
}
