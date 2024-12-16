import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Conversation",
})
export default class Conversation extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://conversation",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_name",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  conversationName: string;

  @SubjectProperty({
    through: "flux://has_summary",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  summary: string;
}
