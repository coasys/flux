import { community, languages } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  SDNAClass,
  SubjectProperty,
  SubjectCollection,
  SubjectFlag,
} from "@coasys/ad4m";
import Message from "../message";

const { BODY, END_DATE, IMAGE, START_DATE, TITLE, URL, ENTRY_TYPE } = community;
const { FILE_STORAGE_LANGUAGE } = languages;

@SDNAClass({
  name: "Post",
})
export class Post {
  @SubjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Post,
  })
  type: string;

  @SubjectProperty({
    through: TITLE,
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @SubjectProperty({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @SubjectProperty({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    // @ts-ignore
    transform: (data) =>
      data ? `data:image/png;base64,${data?.data_base64}` : undefined,
  })
  image: string;

  @SubjectProperty({ through: URL, writable: true, resolveLanguage: "literal" })
  url: string;

  @SubjectCollection({
    through: "ad4m://has_child",
    where: {
      isInstance: Message,
    },
  })
  comments: string[] = [];
}

export default Post;
