import {
  BODY,
  IMAGE,
  REPLY_TO,
  TITLE,
  URL,
} from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";

export interface Message extends Entry {
  body: string;
  replies: string[];
}

class MessageModel extends EntryModel {
  static get type() {
    return EntryType.Message;
  }
  static get properties() {
    return {
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
  }

  async create(data: { body: string }): Promise<Message> {
    return super.create(data) as Promise<Message>;
  }

  async get(id: string) {
    return super.get(id) as Promise<Message>;
  }

  async getAll() {
    return super.getAll() as Promise<Message[]>;
  }
}

export default MessageModel;
