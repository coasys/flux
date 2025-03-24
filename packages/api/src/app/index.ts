import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { Property, ModelOptions, Flag, Ad4mModel } from "@coasys/ad4m";

const { DESCRIPTION, NAME, ENTRY_TYPE } = community;

@ModelOptions({
  name: "App",
})
export class App extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.App,
  })
  type: string;

  @Property({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @Property({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  @Property({
    through: "rdf://icon",
    writable: true,
    resolveLanguage: "literal",
  })
  icon: string;

  @Property({
    through: "rdf://pkg",
    writable: true,
    resolveLanguage: "literal",
  })
  pkg: string;
}

export default App;
