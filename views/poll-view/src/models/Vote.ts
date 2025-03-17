import { SDNAClass, SubjectFlag, SubjectProperty, SubjectEntity } from "@coasys/ad4m";

@SDNAClass({
  name: "Vote",
})
export default class Vote extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_vote",
  })
  type: string;

  @SubjectProperty({
    through: "flux://score",
    writable: true,
    resolveLanguage: "literal",
  })
  score: number;
}
