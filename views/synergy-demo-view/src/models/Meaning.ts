import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "Meaning",
})
export default class Meaning {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_meaning",
  })
  type: string;

  // @SubjectProperty({
  //   through: "rdf://description",
  //   resolveLanguage: "literal",
  // })
  // desc: "";

  @SubjectProperty({
    through: "flux://meaning",
    writable: true,
    resolveLanguage: "literal",
  })
  meaning: string;
}
