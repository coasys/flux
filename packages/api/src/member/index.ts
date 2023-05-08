import { SDNAClass, subjectFlag, subjectProperty } from "@perspect3vism/ad4m";
import { EntryType } from "@fluxapp/types";
import { DID, ENTRY_TYPE } from "../constants/communityPredicates";

@SDNAClass({
  name: "Member",
})
export class Member {
  isSubjectInstance = ['languageName(Base, "agent-expression-store")'];

  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Member,
  })
  type: string;

  @subjectProperty({
    through: DID,
    writable: true,
    resolveLanguage: "literal",
  })
  did: string;
}

export default Member;
