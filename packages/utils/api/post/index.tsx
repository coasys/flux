import { IMAGE, TITLE } from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry, ModelProperty } from "../../types";

class SimplePostModel extends EntryModel {
  static type = EntryType.SimplePost;
  static properties = {
    title: {
      predicate: TITLE,
      type: String,
      languageAddress: "literal",
    },
  };

  create(
    data: { title: string; image?: string },
    type?: EntryType
  ): Promise<Entry> {
    return super.create(data, type);
  }
}

export default SimplePostModel;
