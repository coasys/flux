import {
  DESCRIPTION,
  IMAGE,
  NAME,
  THUMBNAIL,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants/languages";
import { EntryType, Entry } from "../../types";

import {
  SDNAClass,
  subjectProperty,
  subjectCollection,
} from "@perspect3vism/ad4m";

@SDNAClass({
  through: ENTRY_TYPE,
  initial: EntryType.Community,
  required: true,
  name: 'Community'
})
export class Community {
  @subjectProperty({ through: NAME, resolve: true, resolveLanguage: "literal" })
  name: string;

  @subjectProperty({ through: DESCRIPTION, resolve: true, resolveLanguage: "literal" })
  description: string;

  @subjectProperty({ through: IMAGE, resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  image: string;

  @subjectProperty({ through: THUMBNAIL, resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  thumbnail: string;

  @subjectCollection({ through: EntryType.Channel })
  channels: string[] = [];
}

export default Community;
