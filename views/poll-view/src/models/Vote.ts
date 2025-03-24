import { ModelOptions, Flag, Property, Ad4mModel } from "@coasys/ad4m";

@ModelOptions({
  name: "Vote",
})
export default class Vote extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    value: "flux://has_vote",
  })
  type: string;

  @Property({
    through: "flux://score",
    writable: true,
    resolveLanguage: "literal",
  })
  score: number;
}
