/**
 * Utilities for generating and parsing clean call invite URLs
 */

/**
 * Strips protocol prefixes to create clean URL parameters
 */
export function stripUrlPrefixes(neighbourhoodUrl: string, channelId: string) {
  const invite = neighbourhoodUrl.replace('neighbourhood://', '');
  const channel = channelId.replace('literal://string:', '');
  return { invite, channel };
}

/**
 * Restores protocol prefixes from clean URL parameters
 */
export function restoreUrlPrefixes(invite: string, channel: string) {
  const neighbourhoodUrl = `neighbourhood://${invite}`;
  const channelId = `literal://string:${channel}`;
  return { neighbourhoodUrl, channelId };
}

/**
 * Generates a sharable call invite URL
 */
export function generateCallInviteUrl(neighbourhoodUrl: string, channelId: string): string {
  const { invite, channel } = stripUrlPrefixes(neighbourhoodUrl, channelId);
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({ invite, channel });
  return `${baseUrl}/#/join-call?${params.toString()}`;
}

/**
 * Parses a call invite URL to extract neighbourhood and channel info
 */
export function parseCallInviteUrl(searchParams: URLSearchParams): {
  neighbourhoodUrl: string;
  channelId: string;
} | null {
  const invite = searchParams.get('invite');
  const channel = searchParams.get('channel');

  if (!invite || !channel) return null;

  return restoreUrlPrefixes(invite, channel);
}
