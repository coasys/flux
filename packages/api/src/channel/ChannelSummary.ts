import { Ad4mModel, Flag, Model, Property } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';

const { ENTRY_TYPE, CHANNEL_NAME, CHANNEL_DESCRIPTION, CHANNEL_IS_CONVERSATION, CHANNEL_IS_PINNED } = community;

/**
 * Lightweight Channel for sidebar/list rendering.
 *
 * No @HasMany relations — no hidden graph exploration during hydration.
 * Use `Channel` (full model) only when you need to traverse relations
 * like `messages`, `conversations`, `views`, etc.
 *
 * Shares `@Model({ name: 'Channel' })` with the full Channel model intentionally —
 * both query the same SDNA subject class but this model hydrates fewer properties.
 * The full Channel model must be registered first (via Ad4mModel.registerAll) to
 * install the SDNA; ChannelSummary piggybacks on that registration.
 */
@Model({ name: 'Channel' })
export class ChannelSummary extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Channel })
  type: string;

  @Property({ through: CHANNEL_NAME })
  name: string;

  @Property({ through: CHANNEL_DESCRIPTION })
  description: string;

  @Property({ through: CHANNEL_IS_CONVERSATION })
  isConversation: boolean;

  @Property({ through: CHANNEL_IS_PINNED })
  isPinned: boolean;
}

export default ChannelSummary;
