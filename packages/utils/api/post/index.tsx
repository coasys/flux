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
  subjectFlag,
} from "@perspect3vism/ad4m";

@SDNAClass({
  name: 'Post'
})
export class Post {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Post,
  })
  type: string;
  
  @subjectProperty({ through: TITLE, writable: true, resolveLanguage: "literal" })
  title: string;

  @subjectProperty({ through: BODY, writable: true, resolveLanguage: "literal" })
  body: string;

  @subjectProperty({ through: IMAGE, writable: true, resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  image: string;

  @subjectProperty({ through: START_DATE, writable: true, resolveLanguage: "literal" })
  startDate: string;

  @subjectProperty({ through: END_DATE, writable: true, resolveLanguage: "literal" })
  endDate: string;

  @subjectProperty({ through: URL, writable: true, resolveLanguage: "literal" })
  url: string;

  @subjectCollection({ through: EntryType.Message })
  comments: string[];
}

export default Post;
