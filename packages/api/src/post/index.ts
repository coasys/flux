import { Ad4mModel, Collection, Flag, ModelOptions, Optional, Property } from "@coasys/ad4m";
import { community, languages } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
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

  @Optional({
    through: BODY,
    writable: true,
    resolveLanguage: "literal",
  })
  body: string;

  @Optional({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) => (data ? `data:image/png;base64,${data?.data_base64}` : undefined),
  })
  image: string;

  @Optional({ through: URL, writable: true, resolveLanguage: "literal" })
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
