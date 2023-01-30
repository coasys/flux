import {
  NAME,
  SELF,
  FONT_FAMILY,
  HUE,
  SATURATION
} from "../../constants/communityPredicates";
import EntryModel from "../../helpers/model";
import { EntryType, Entry } from "../../types";
import MemberModel from "../member";

export interface Theme extends Entry {
  name: string;
  fontFamily: string;
  hue: number;
  saturation: number;
  fontSize: string;
}

class ThemeModal extends EntryModel {
    static get type() {
        return EntryType.Theme;
    }
    static get properties() {
        return {
            name: {
                predicate: NAME,
                type: String,
                resolve: true,
                languageAddress: "literal",
            },
            fontFamily: {
                predicate: FONT_FAMILY,
                type: String,
                resolve: true,
                languageAddress: "literal",
            },
            hue: {
                predicate: HUE,
                type: Number,
                resolve: true,
                languageAddress: "literal",
            },
            saturation: {
                predicate: SATURATION,
                type: Number,
                resolve: true,
                languageAddress: "literal",
            },
            fontSize: {
                predicate: FONT_FAMILY,
                type: String,
                resolve: true,
                languageAddress: "literal",
            }
        };
    }

    async create(data: {
        name: string;
        description: string;
        image?: string;
        thumbnail?: string;
        theme?: string;
    }): Promise<Theme> {
        return super.create(data, SELF) as Promise<Theme>;
    }

    addMember({ did }: { did: string }) {
        const Member = new MemberModel({ perspectiveUuid: this.perspectiveUuid });
        Member.create({ did });
    }

    async get() {
        return super.get(SELF) as Promise<Theme>;
    }

    async getAll() {
        return super.getAll(SELF) as Promise<Theme[]>;
    }

    // TODO: We don't need to send in id here
    // but ts complains if we extend the function without inncluding id as param
    async update(
        id: string,
        data: {
            name?: string;
            fontFamily?: string;
            hue?: number;
            saturation?: number;
            fontSize?: string;
        }
    ) {
        return super.update(SELF, data) as Promise<Theme>;
    }
}

export default ThemeModal;
