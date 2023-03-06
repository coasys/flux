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
  static get type() {
    return EntryType.Community;
  }
  static get properties() {
    return {
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
        type: Object,
        resolve: false,
        languageAddress: NOTE_IPFS_EXPRESSION_OFFICIAL,
      },
      thumbnail: {
        predicate: THUMBNAIL,
        type: Object,
        resolve: false,
        languageAddress: NOTE_IPFS_EXPRESSION_OFFICIAL,
      },
      channels: {
        predicate: EntryType.Channel,
        type: String,
        collection: true,
        resolve: false,
      },
    };
  }

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

  // TODO: We don't need to send in id here
  // but ts complains if we extend the function without inncluding id as param
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      thumbnail?: string;
    }
  ) {
    return super.update(SELF, data) as Promise<Community>;
  }
}

export default CommunityModel;
