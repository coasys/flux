import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { SubjectProperty, SDNAClass, SubjectFlag, SubjectEntity } from "@coasys/ad4m";

const { DESCRIPTION, NAME, ENTRY_TYPE } = community;

@SDNAClass({
  name: "App",
})
export class App extends SubjectEntity {
  @SubjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.App,
  })
  type: string;

  @SubjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @SubjectProperty({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  @SubjectProperty({
    through: "rdf://icon",
    writable: true,
    resolveLanguage: "literal",
  })
  icon: string;

  @SubjectProperty({
    through: "rdf://pkg",
    writable: true,
    resolveLanguage: "literal",
  })
  pkg: string;
}

export default App;
