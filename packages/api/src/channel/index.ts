import { community } from "@fluxapp/constants";
import { EntryType, ChannelView } from "@fluxapp/types";
import {
  subjectProperty,
  subjectCollection,
  SDNAClass,
  subjectFlag,
} from "@perspect3vism/ad4m";

const { CHANNEL_VIEW, NAME, ENTRY_TYPE } = community;

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
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @subjectCollection({
    through: CHANNEL_VIEW,
  })
  views: string[] = [];
}

export default Channel;
