import { CHANNEL_VIEW, NAME, ENTRY_TYPE } from "../../constants/communityPredicates";
import { EntryType, Entry, ChannelView } from "../../types";
import { sdnaOutput, subjectProperty, subjectPropertySetter, subjectCollection } from "@perspect3vism/ad4m";

export class Channel {
  @subjectProperty({
    through: ENTRY_TYPE, 
    initial: EntryType.Channel,
    required: true,
  })
  type: string;

  @subjectProperty({
    through: NAME,
    resolve: true,
  })
  name: string;

  @subjectPropertySetter({
    resolveLanguage: 'literal'
  })
  setName(name: string) {}

  @subjectCollection({
    through: CHANNEL_VIEW,
  })
  views: string[];
  addView(view: string) {}

  @sdnaOutput
  static generateSdna(): string { return "" }
}

export interface UpdateChannel {
  name?: string;
  views?: ChannelView[];
}

export default SubjectEntry<Channel>;