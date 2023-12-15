import { community, languages } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
  subjectFlag,
} from "@coasys/ad4m";
import Message from "../message";

const { BODY, END_DATE, IMAGE, START_DATE, TITLE, URL, ENTRY_TYPE } = community;
const { FILE_STORAGE_LANGUAGE } = languages;

@SDNAClass({
  name: "Post",
})
export class Post {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Post,
  })
  type: string;

  @subjectProperty({
    through: TITLE,
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @subjectProperty({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @subjectProperty({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    // @ts-ignore
    transform: (data) =>
      data ? `data:image/png;base64,${data?.data_base64}` : undefined,
  })
  image: string;

  @subjectProperty({ through: URL, writable: true, resolveLanguage: "literal" })
  url: string;

  @subjectCollection({
    through: "ad4m://has_child",
    where: {
      isInstance: Message,
    },
  })
  comments: string[] = [];
}

export default Post;
