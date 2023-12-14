import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  subjectProperty,
  subjectCollection,
  SDNAClass,
  subjectFlag,
} from "@coasys/ad4m";
import App from "../app";

const { FLUX_APP, NAME, ENTRY_TYPE } = community;

@SDNAClass({
  name: "Channel",
})
export class Channel {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @subjectProperty({
    through: NAME,
    required: true,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @subjectCollection({
    through: "ad4m://has_child",
    where: {
      isInstance: App,
    },
  })
  views: string[] = [];
}

export default Channel;
