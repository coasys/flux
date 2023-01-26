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
  sdnaOutput,
  subjectProperty,
  subjectPropertySetter,
  subjectCollection,
} from "@perspect3vism/ad4m";

export class Community {
  @subjectProperty({
    through: ENTRY_TYPE,
    initial: EntryType.Community,
    required: true,
  })
  type: string;

  @subjectProperty({ through: NAME, resolve: true })
  name: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setName(name: string) {}

  @subjectProperty({ through: DESCRIPTION, resolve: true })
  description: string;
  @subjectPropertySetter({ resolveLanguage: "literal" })
  setDescription(description: string) {}

  @subjectProperty({ through: IMAGE })
  image: string;
  @subjectPropertySetter({ resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  setImage(image: string) {}

  @subjectProperty({ through: THUMBNAIL })
  thumbnail: string;
  @subjectPropertySetter({ resolveLanguage: NOTE_IPFS_EXPRESSION_OFFICIAL })
  setThumbnail(thumbnail: string) {}

  @subjectCollection({ through: EntryType.Channel })
  channels: string[] = [];
  addChannel(channel: string) {}

  @sdnaOutput
  static generateSDNA(): string {
    return "";
  }
}

export default Community;
