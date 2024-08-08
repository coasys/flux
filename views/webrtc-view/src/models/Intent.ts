import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Intent",
})
export default class Intent {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_intent",
  })
  type: string;

  @SubjectProperty({
    through: "flux://intent",
    writable: true,
    resolveLanguage: "literal",
  })
  intent: string;
}
