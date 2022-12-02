import {
  BODY,
  END_DATE,
  IMAGE,
  REPLY_TO,
  START_DATE,
  TITLE,
  URL,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants/languages";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";
import MessageModel from "../message";

class PostModel extends EntryModel {
  static type = EntryType.Post;
  static properties = {
    title: {
      predicate: TITLE,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    body: {
      predicate: BODY,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    image: {
      predicate: IMAGE,
      type: String,
      resolve: false,
      languageAddress: NOTE_IPFS_EXPRESSION_OFFICIAL,
    },
    startDate: {
      predicate: START_DATE,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    endDate: {
      predicate: END_DATE,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    url: {
      predicate: URL,
      type: String,
      resolve: true,
      languageAddress: NOTE_IPFS_EXPRESSION_OFFICIAL,
    },
    comments: {
      predicate: EntryType.Message,
      type: String,
      resolve: false,
      collection: true,
    },
  };

  create(data: {
    title: string;
    image?: string;
    body?: string;
    startDate?: string;
    endDate?: string;
    url?: string;
  }): Promise<Entry> {
    return super.create(data);
  }

  createComment(replyTo: string, body: string) {
    // TODO: Add a link from replyTo with Predicate
    // REPLY_TO and the new message.id as target
    const Message = new MessageModel({
      perspectiveUuid: this.perspectiveUuid,
      source: replyTo,
    });
    return Message.create({ body });
  }

  getComments(id: string) {
    const Message = new MessageModel({
      perspectiveUuid: this.perspectiveUuid,
      source: id,
    });
    return Message.getAll();
  }
}

export default PostModel;
