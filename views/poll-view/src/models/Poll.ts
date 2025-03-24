import { ModelOptions, Flag, Property, Ad4mModel } from "@coasys/ad4m";

@ModelOptions({
  name: "Poll",
})
export default class Poll extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    value: "flux://has_poll",
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
  description: string;

  @Property({
    through: "flux://vote_type",
    writable: true,
    resolveLanguage: "literal",
  })
  voteType: "single-choice" | "multiple-choice" | "weighted-choice";

  @Property({
    through: "flux://poll_answers_locked",
    writable: true,
    resolveLanguage: "literal",
  })
  answersLocked: boolean;
}
