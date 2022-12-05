import { CHANNEL_VIEW, NAME } from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry, ChannelView } from "../../types";

class ChannelModel extends EntryModel {
  static type = EntryType.Channel;
  static properties = {
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

  async create(data: { name: string; views: ChannelView[] }): Promise<Entry> {
    return super.create(data);
  }
}

export default ChannelModel;
