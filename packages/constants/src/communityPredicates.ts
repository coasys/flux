export const DESCRIPTION = 'rdf://description';

export const SELF = 'ad4m://self';

export const LANGUAGE = 'ad4m://language';

export const CREATOR = 'rdf://creator';

export const CREATED_AT = 'rdf://dateCreated';

export const NAME = 'rdf://name';

export const MEMBER = 'sioc://has_member';

export const EXPRESSION = 'sioc://content_of';

export const EDITED_TO = 'temp://edited_to';

export const CHANNEL = 'flux://has_channel';

export const CHANNEL_NAME = 'flux://has_channel_name';

export const CHANNEL_DESCRIPTION = 'flux://has_channel_description';

export const CHANNEL_IS_CONVERSATION = 'flux://channel_is_conversation';

export const CHANNEL_IS_PINNED = 'flux://channel_is_pinned';

export const FLUX_APP = 'flux://has_app';

export const FLUX_PARTICIPANT = 'flux://has_participant';

export const AD4M_CLASS = 'ad4m://has_class';

export const FLUX_CHANNEL = 'flux://channel';

export const FLUX_GROUP_NAME = 'flux://communityName';

export const FLUX_GROUP_DESCRIPTION = 'flux://communityDescription';

export const FLUX_GROUP_IMAGE = 'flux://communityImage';

export const FLUX_GROUP_THUMBNAIL = 'flux://communityThumbnail';

export const ZOME = 'ad4m://has_zome';

export const CARD_HIDDEN = 'flux://is_card_hidden';

export const OMIT = 'flux://null';

export const HAS_REPLY = 'flux://has_reply';

export const REACTION = 'flux://has_reaction';

export const ENTRY_TYPE = 'flux://entry_type';

export const TITLE = 'flux://title';

export const BODY = 'flux://body';

export const URL = 'flux://url';

export const IMAGE = 'flux://image';

export const TRANSCRIPT_STARTED_AT = 'flux://transcript_started_at';

export const THUMBNAIL = 'flux://thumbnail';

export const START_DATE = 'flux://start_date';

export const END_DATE = 'flux://end_date';

export const SDNA_VERSION = 'ad4m://sdna_version';

export const DID = 'ad4m://did';

// ── Semantic parent→child relation predicates (replace ad4m://has_child) ──────

/** Channel → Message */
export const CHANNEL_MESSAGE = 'flux://has_message';

/** Channel → Conversation */
export const CHANNEL_CONVERSATION = 'flux://has_conversation';

/** Channel → Channel (child/nested channel) */
export const CHANNEL_SUBCHANNEL = 'flux://has_subchannel';

/** Conversation → ConversationSubgroup */
export const CONVERSATION_SUBGROUP = 'flux://has_subgroup';

/** ConversationSubgroup → Message/Post/Task item */
export const SUBGROUP_ITEM = 'flux://has_item';

/** Message → Message (thread reply) */
export const MESSAGE_THREAD = 'flux://has_thread_message';

/** Channel → TaskBoard */
export const CHANNEL_TASK_BOARD = 'flux://has_task_board';

/** Channel → TaskColumn */
export const CHANNEL_TASK_COLUMN = 'flux://has_task_column';

/** Channel → Task */
export const CHANNEL_TASK = 'flux://has_task';

/** Channel → Post */
export const CHANNEL_POST = 'flux://has_post';

/** Task → Message (comment) */
export const TASK_COMMENT = 'flux://has_task_comment';

/** Post → Message (comment) */
export const POST_COMMENT = 'flux://has_post_comment';

/** Channel → Poll */
export const CHANNEL_POLL = 'flux://has_poll';
