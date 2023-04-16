import { SDNAClass, subjectProperty, subjectFlag } from "@perspect3vism/ad4m";

@SDNAClass({
  name: "Todo",
})
export default class Todo {
  @subjectFlag({
    through: "flux://entry_type",
    value: "flux://has_todo",
  })
  type: string;

  @subjectProperty({
    through: "rdf://title",
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @subjectProperty({
    through: "rdf://status",
    writable: true,
    resolveLanguage: "literal",
  })
  done: boolean;
}
