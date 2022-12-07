import {
  DESCRIPTION,
  IMAGE,
  NAME,
  SELF,
  THUMBNAIL,
} from "../../constants/communityPredicates";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "../../constants/languages";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";
import MemberModel from "../member";

export interface Community extends Entry {
  name: string;
  description: string;
  image: string;
  thumbnail: string;
}

class CommunityModel extends EntryModel {
  static type = EntryType.Community;
  static properties = {
    name: {
      predicate: NAME,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    description: {
      predicate: DESCRIPTION,
      type: String,
      resolve: true,
      languageAddress: "literal",
    },
    image: {
      predicate: IMAGE,
      type: String,
      resolve: true,
      languageAddress: NOTE_IPFS_EXPRESSION_OFFICIAL,
    },
    thumbnail: {
      predicate: THUMBNAIL,
      type: String,
      resolve: false,
      languageAddress: NOTE_IPFS_EXPRESSION_OFFICIAL,
    },
    channels: {
      predicate: EntryType.Channel,
      type: String,
      resolve: false,
    },
  };

  async create(data: {
    name: string;
    description: string;
    image?: string;
    thumbnail?: string;
  }): Promise<Community> {
    return super.create(data, SELF) as Promise<Community>;
  }

  addMember({ did }: { did: string }) {
    const Member = new MemberModel({ perspectiveUuid: this.perspectiveUuid });
    Member.create({ did });
  }

  async get() {
    return super.get(SELF) as Promise<Community>;
  }
}

export default CommunityModel;
