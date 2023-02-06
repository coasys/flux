import {
  CHANNEL_VIEW,
  NAME,
  ENTRY_TYPE,
} from "../../constants/communityPredicates";
import { EntryType, Entry, ChannelView } from "../../types";
import {
  subjectProperty,
  subjectCollection,
  SDNAClass
} from "@perspect3vism/ad4m";

@SDNAClass({
  through: ENTRY_TYPE,
  initial: EntryType.Channel,
  required: true,
  name: 'Channel'
})
export class Channel {
  @subjectProperty({
    through: NAME,
    resolve: true,
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
