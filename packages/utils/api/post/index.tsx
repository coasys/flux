import {
  BODY,
  END_DATE,
  IMAGE,
  START_DATE,
  TITLE,
  URL,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants/languages";
import { EntryType } from "../../types";
import {
  sdnaOutput,
  subjectProperty,
  subjectPropertySetter,
  subjectCollection,
} from "@perspect3vism/ad4m";

export class Post {
  @subjectProperty({
    through: ENTRY_TYPE,
    initial: EntryType.Post,
    required: true,
  })
  @subjectProperty({ through: TITLE, resolve: true })
  title: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setTitle(title: string) {}

  @subjectProperty({ through: BODY, resolve: true })
  body: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setBody(body: string) {}

  @subjectProperty({ through: IMAGE })
  image: string;
  @subjectPropertySetter({ resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  setImage(image: string) {}

  @subjectProperty({ through: START_DATE, resolve: true })
  startDate: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setStartDate(startDate: string) {}

  @subjectProperty({ through: END_DATE, resolve: true })
  endDate: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setEndDate(endDate: string) {}

  @subjectProperty({ through: URL, resolve: true })
  url: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setUrl(endDate: string) {}

  @subjectCollection({ through: EntryType.Message })
  comments: string[];
  addComment(comment: string) {}

  @sdnaOutput
  static generateSDNA(): string {
    return "";
  }
}

export default Post;
