import { community, languages } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
  subjectFlag,
} from "@perspect3vism/ad4m";

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
    through: "rdf://has_child",
    where: {
      condition: `subject_class("Message", Class), instance(Class, Target)`,
    },
  })
  comments: string[] = [];
}

export default Post;
