import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import {
  SubjectProperty,
  SubjectCollection,
  SDNAClass,
  SubjectFlag,
} from "@coasys/ad4m";
import App from "../app";

const { FLUX_APP, NAME, ENTRY_TYPE } = community;

@SDNAClass({
  name: "Channel",
})
export class Channel {
  @SubjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @SubjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @SubjectCollection({
    through: "ad4m://has_child",
    where: {
      isInstance: App,
    },
  })
  views: string[] = [];
}

export default Channel;
