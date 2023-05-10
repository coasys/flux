import { EntryType } from "@fluxapp/types";
import { community, languages } from "@fluxapp/constants";

const { FILE_STORAGE_LANGUAGE } = languages;
const { DESCRIPTION, IMAGE, NAME, THUMBNAIL, ENTRY_TYPE } = community;

import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
  subjectFlag,
} from "@perspect3vism/ad4m";

@SDNAClass({
  name: "Community",
})
export class Community {
  @subjectFlag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;

  @subjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @subjectProperty({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  // @ts-ignore
  @subjectProperty({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) =>
      data ? `data:image/png;base64,${data?.data_base64}` : undefined,
  })
  image: string;

  // @ts-ignore
  @subjectProperty({
    through: THUMBNAIL,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) =>
      data ? `data:image/png;base64,${data?.data_base64}` : undefined,
  })
  thumbnail: string;

  @subjectCollection({ through: EntryType.Channel })
  channels: string[] = [];
}

export default Community;
