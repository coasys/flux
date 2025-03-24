import { community, languages } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { ModelOptions, Property, Collection, Flag, Ad4mModel } from "@coasys/ad4m";
import Message from "../message";

const { BODY, END_DATE, IMAGE, START_DATE, TITLE, URL, ENTRY_TYPE } = community;
const { FILE_STORAGE_LANGUAGE } = languages;

@ModelOptions({
  name: "Post",
})
export class Post extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.Post,
  })
  type: string;

  @Property({
    through: TITLE,
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @Property({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @Property({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    // @ts-ignore
    transform: (data) => (data ? `data:image/png;base64,${data?.data_base64}` : undefined),
  })
  image: string;

  @Property({ through: URL, writable: true, resolveLanguage: "literal" })
  url: string;

  @Collection({
    through: "ad4m://has_child",
    where: {
      isInstance: Message,
    },
  })
  comments: string[] = [];
}

export default Post;
