import { community } from "@fluxapp/constants";
import { EntryType } from "@fluxapp/types";
import {
  subjectProperty,
  subjectFlag,
  subjectCollection,
  SDNAClass,
} from "@perspect3vism/ad4m";

const { NAME, ENTRY_TYPE } = community;

@SDNAClass({
  name: "List",
})
export class List {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @subjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string = "No name";

  @subjectProperty({
    through: "rdf://order",
    writable: true,
    resolveLanguage: "literal",
  })
  order: string = "a0";

  @subjectCollection({
    through: "rdf://has_child",
  })
  children?: string[] = [];
}

export default List;
