import {
  BODY,
  IMAGE,
  REPLY_TO,
  TITLE,
  URL,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants/languages";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";

class MessageModel extends EntryModel {
  static type = EntryType.Message;
  static properties = {
    body: {
      predicate: BODY,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    replies: {
      predicate: REPLY_TO,
      type: String,
      collection: true,
      resolve: false,
    },
  };

  async create(data: { body: string }): Promise<Entry> {
    return super.create(data);
  }
}

export default MessageModel;
