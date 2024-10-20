import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Poll",
})
export default class Poll {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_poll",
  })
  type: string;

  @SubjectProperty({
    through: "rdf://title",
    resolveLanguage: "literal",
  })
  title: string;

  @SubjectProperty({
    through: "rdf://description",
    resolveLanguage: "literal",
  })
  description: string;
}
