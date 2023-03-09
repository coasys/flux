import { CHANNEL_VIEW, NAME } from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";

export interface Channel extends Entry {
  name: string;
  views: string[];
}

export interface UpdateChannel {
  name?: string;
  views?: string[];
}

class ChannelModel extends EntryModel {
  static get type() {
    return EntryType.Channel;
  }
  static get properties() {
    return {
      name: {
        predicate: NAME,
        type: String,
        resolve: true,
        languageAddress: "literal",
      },
      views: {
        predicate: CHANNEL_VIEW,
        type: String,
        collection: true,
        resolve: false,
      },
    };
  }

  async create(data: { name: string; views: string[] }) {
    return super.create(data) as Promise<Channel>;
  }

  async update(id: string, data: UpdateChannel) {
    return super.update(id, data) as Promise<Channel>;
  }

  async getAll(): Promise<Channel[]> {
    return super.getAll() as Promise<Channel[]>;
  }
}

export default ChannelModel;
