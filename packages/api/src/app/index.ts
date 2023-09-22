import { community } from "@fluxapp/constants";
import { EntryType } from "@fluxapp/types";
import { subjectProperty, SDNAClass, subjectFlag } from "@perspect3vism/ad4m";

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
