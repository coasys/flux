import { IMAGE, TITLE } from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";

export default class PostModel extends EntryModel {
  constructor(props: {
    perspectiveUuid: string;
    source: string;
    type?: EntryType;
  }) {
    super(props);
    this.type = EntryType.SimplePost;
    this.properties = {
      title: {
        predicate: TITLE,
        type: String,
        languageAddress: "literal",
      },
    };
  }

  create(data: { title: string }, type?: EntryType): Promise<Entry> {
    return super.create(data, type);
  }
}
