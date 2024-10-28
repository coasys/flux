import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "DecisionTree",
})
export default class DecisionTree {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_decision_tree",
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
  description: string;

  @SubjectProperty({
    through: "flux://vote_type",
    writable: true,
    resolveLanguage: "literal",
  })
  voteType: "single-choice" | "multiple-choice" | "weighted-choice";

  @SubjectProperty({
    through: "flux://answers_locked",
    writable: true,
    resolveLanguage: "literal",
  })
  answersLocked: boolean;
}
