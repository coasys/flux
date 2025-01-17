import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "ConversationSubgroup",
})
export default class ConversationSubgroup extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://conversation_subgroup",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_name",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  subgroupName: string;

  @SubjectProperty({
    through: "flux://has_summary",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  summary: string;

  @SubjectProperty({
    through: "flux://has_position_timestamp",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  positionTimestamp: string;
}
