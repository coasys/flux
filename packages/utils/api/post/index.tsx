import {
  BODY,
  END_DATE,
  IMAGE,
  START_DATE,
  TITLE,
  URL,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants";
import { EntryType } from "../../types";
import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
} from "@perspect3vism/ad4m";

@SDNAClass({
  through: ENTRY_TYPE,
  initial: EntryType.Post,
  required: true,
  name: 'Post'
})
export class Post {
  @subjectProperty({ through: TITLE, resolve: true, resolveLanguage: "literal" })
  title: string;

  @subjectProperty({ through: BODY, resolve: true, resolveLanguage: "literal" })
  body: string;

  @subjectProperty({ through: IMAGE, resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  image: string;

  @subjectProperty({ through: START_DATE, resolve: true, resolveLanguage: "literal" })
  startDate: string;

  @subjectProperty({ through: END_DATE, resolve: true, resolveLanguage: "literal" })
  endDate: string;

  @subjectProperty({ through: URL, resolve: true, resolveLanguage: "literal" })
  url: string;

  @subjectCollection({ through: EntryType.Message })
  comments: string[];
}

export default Post;
