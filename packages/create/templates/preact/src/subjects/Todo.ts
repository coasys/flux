import { ModelOptions, Property, Flag } from "@coasys/ad4m";

@ModelOptions({
  name: "Todo",
})
export default class Todo {
  @Flag({
    through: "flux://entry_type",
    value: "flux://has_todo",
  })
  type: string;

  @Property({
    through: "rdf://title",
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @Property({
    through: "rdf://description",
    writable: true,
    resolveLanguage: "literal",
  })
  desc: string;

  @Property({
    through: "rdf://status",
    writable: true,
    resolveLanguage: "literal",
  })
  done: boolean;
}
