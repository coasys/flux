import { Link } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';

const CHANNEL_PREDICATE = community.CHANNEL;

export function buildChannelParentLink(parentId: string | undefined, channelId: string) {
  return new Link({
    source: parentId ?? 'ad4m://self',
    predicate: CHANNEL_PREDICATE,
    target: channelId,
  });
}
