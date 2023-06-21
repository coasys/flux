import {
  SDNAClass,
  subjectProperty,
  subjectFlag,
  Literal,
} from "@perspect3vism/ad4m";

@SDNAClass({
  name: "Todo",
})
export default class Todo {
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
