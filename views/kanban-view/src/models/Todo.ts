import { SDNAClass, subjectProperty } from "@perspect3vism/ad4m";

@SDNAClass({
  name: "Task",
})
export default class Task {
  @subjectProperty({
    through: "rdf://title",
    initial: "literal://string:Hello",
    required: true,
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @subjectProperty({
    through: "rdf://description",
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  @subjectProperty({
    through: "rdf://status",
    writable: true,
    resolveLanguage: "literal",
  })
  status: string;
}
