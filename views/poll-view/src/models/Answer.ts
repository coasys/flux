import { ModelOptions, Flag, Property, Ad4mModel } from "@coasys/ad4m";

@ModelOptions({
  name: "Answer",
})
export default class Answer extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    value: "flux://has_answer",
  })
  type: string;

  @Property({
    through: "rdf://text",
    writable: true,
    resolveLanguage: "literal",
  })
  text: string;
}
