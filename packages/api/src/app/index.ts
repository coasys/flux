import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { subjectProperty, SDNAClass, subjectFlag } from "@coasys/ad4m";

const { DESCRIPTION, NAME, ENTRY_TYPE } = community;

@SDNAClass({
  name: "App",
})
export class App {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.App,
  })
  type: string;

  @subjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @subjectProperty({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  @subjectProperty({
    through: "rdf://icon",
    writable: true,
    resolveLanguage: "literal",
  })
  icon: string;

  @subjectProperty({
    through: "rdf://pkg",
    writable: true,
    resolveLanguage: "literal",
  })
  pkg: string;
}

export default App;
