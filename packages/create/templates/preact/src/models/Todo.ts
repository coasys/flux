import { SDNAClass, subjectProperty, subjectFlag } from "@perspect3vism/ad4m";

@SDNAClass({
  name: "EnhancedTodo",
})
export default class EnhancedTodo {
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
    through: "rdf://description",
    writable: true,
    resolveLanguage: "literal",
  })
  desc: string;

  @subjectProperty({
    through: "rdf://status",
    writable: true,
    resolveLanguage: "literal",
  })
  done: boolean;
}
