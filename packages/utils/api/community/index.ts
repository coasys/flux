import {
  DESCRIPTION,
  IMAGE,
  NAME,
  THUMBNAIL,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants";
import { EntryType, Entry } from "../../types";

import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
  subjectFlag,
} from "@perspect3vism/ad4m";

@SDNAClass({
  name: 'Community'
})
export class Community {
  @subjectFlag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;
  
  @subjectProperty({ through: NAME, writable: true, resolveLanguage: "literal" })
  name: string;

  @subjectProperty({ through: DESCRIPTION, writable: true, resolveLanguage: "literal" })
  description: string;

  @subjectProperty({ through: IMAGE, writable: true, resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  image: string;

  @subjectProperty({ through: THUMBNAIL, writable: true, resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  thumbnail: string;

  @subjectCollection({ through: EntryType.Channel })
  channels: string[] = [];
}

export default Community;
