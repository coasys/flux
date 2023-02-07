import { SDNAClass, subjectProperty } from "@perspect3vism/ad4m";
import { EntryType } from "../../types";
import { DID, ENTRY_TYPE } from "../../constants";

@SDNAClass({
  through: ENTRY_TYPE,
  initial: EntryType.Member,
  required: true,
  name: 'Member'
})
export class Member {
  isSubjectInstance = ['languageName(Base, "agent-expression-store")'];

  @subjectProperty({
    through: DID,
    resolve: true,
    resolveLanguage: "literal",
  })
  did: string;
}

export default Member;
