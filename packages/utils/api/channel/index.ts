import {
  CHANNEL_VIEW,
  NAME,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { EntryType, Entry, ChannelView } from "../../types";
import {
  subjectProperty,
  subjectCollection,
  SDNAClass,
  subjectFlag
} from "@perspect3vism/ad4m";

@SDNAClass({
  name: 'Channel'
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

export interface UpdateChannel {
  name?: string;
  views?: ChannelView[];
}

export default Channel;
