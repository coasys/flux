import { EntryType } from "@coasys/flux-types";
import { community, languages } from "@coasys/flux-constants";

const { FILE_STORAGE_LANGUAGE } = languages;
const { DESCRIPTION, IMAGE, NAME, THUMBNAIL, ENTRY_TYPE } = community;

import { ModelOptions, Property, Collection, Flag, Ad4mModel } from "@coasys/ad4m";
import Channel from "../channel";

@ModelOptions({
  name: "Community",
})
export class Community extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;

  @Property({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @Property({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  // @ts-ignore
  @Property({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) => (data ? `data:image/png;base64,${data?.data_base64}` : undefined),
  })
  image: string;

  // @ts-ignore
  @Property({
    through: THUMBNAIL,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) => (data ? `data:image/png;base64,${data?.data_base64}` : undefined),
  })
  thumbnail: string;

  @Collection({
    through: "ad4m://has_child",
    where: {
      isInstance: Channel,
    },
  })
  channels: string[] = [];
}

export default Community;
