import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Vote",
})
export default class Vote {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_vote",
  })
  type: string;

  @SubjectProperty({
    through: "flux://value",
    writable: true,
    resolveLanguage: "literal",
  })
  value: null | number;

  //   @SubjectProperty({
  //     through: "flux://state",
  //     writable: true,
  //     resolveLanguage: "literal",
  //   })
  //   state: string;
}
