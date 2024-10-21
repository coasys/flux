import { SDNAClass, SubjectCollection, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Poll",
})
export default class Poll {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_poll",
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
    through: "flux://poll_answers_locked",
    writable: true,
    resolveLanguage: "literal",
  })
  answersLocked: boolean;

  @SubjectCollection({
    through: "flux://has_poll_answer",
  })
  answers: string[];
}
