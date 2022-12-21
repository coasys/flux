import {
  CHANNEL_VIEW,
  DID,
  MEMBER,
  NAME,
} from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry, ChannelView } from "../../types";

export interface Member extends Entry {
  did: string;
}

class MemberModel extends EntryModel {
  static get type() {
    return EntryType.Member;
  }

  static get properties() {
    return {
      did: {
        predicate: DID,
        type: String,
        resolve: false,
      },
    };
  }

  async create(data: { did: string }): Promise<Member> {
    return super.create(data) as Promise<Member>;
  }

  async getAll() {
    return super.getAll() as Promise<Member[]>;
  }

  async get(id: string) {
    return super.get(id) as Promise<Member>;
  }
}

export default MemberModel;
