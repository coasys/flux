import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Topic",
})
export default class Topic {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_topic",
  })
  type: string;

  // @SubjectProperty({
  //   through: "rdf://description",
  //   resolveLanguage: "literal",
  // })
  // desc: "";

  @SubjectProperty({
    through: "flux://topic",
    writable: true,
    resolveLanguage: "literal",
  })
  topic: string;
}
