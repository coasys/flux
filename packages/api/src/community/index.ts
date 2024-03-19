import { EntryType } from "@coasys/flux-types";
import { community, languages } from "@coasys/flux-constants";

const { FILE_STORAGE_LANGUAGE } = languages;
const { DESCRIPTION, IMAGE, NAME, THUMBNAIL, ENTRY_TYPE } = community;

import {
  SDNAClass,
  SubjectProperty,
  SubjectCollection,
  SubjectFlag,
} from "@coasys/ad4m";
import Channel from "../channel";

@SDNAClass({
  name: "Community",
})
export class Community {
  @SubjectFlag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;

  @SubjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @SubjectProperty({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  // @ts-ignore
  @SubjectProperty({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) =>
      data ? `data:image/png;base64,${data?.data_base64}` : undefined,
  })
  image: string;

  // @ts-ignore
  @SubjectProperty({
    through: THUMBNAIL,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) =>
      data ? `data:image/png;base64,${data?.data_base64}` : undefined,
  })
  thumbnail: string;

  @SubjectCollection({
    through: "ad4m://has_child",
    where: {
      isInstance: Channel,
    },
  })
  channels: string[] = [];
}

export default Community;
