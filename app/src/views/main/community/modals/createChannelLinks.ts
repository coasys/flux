import { Link } from '@coasys/ad4m';

const CHANNEL_PREDICATE = 'flux://has_channel';

export function buildChannelParentLink(parentId: string | undefined, channelId: string) {
  return new Link({
    source: parentId || 'ad4m://self',
    predicate: CHANNEL_PREDICATE,
    target: channelId,
  });
}
