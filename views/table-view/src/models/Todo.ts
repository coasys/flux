import { SDNAClass, SubjectProperty, SubjectFlag, SubjectEntity } from "@coasys/ad4m";

@SDNAClass({
  name: "Todo",
})
export default class Todo extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_todo",
  })
  type: string;

  @SubjectProperty({
    through: "rdf://title",
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @SubjectProperty({
    through: "rdf://description",
    writable: true,
    resolveLanguage: "literal",
  })
  desc: string;

  @SubjectProperty({
    through: "rdf://status",
    writable: true,
    resolveLanguage: "literal",
  })
  done: boolean;
}
