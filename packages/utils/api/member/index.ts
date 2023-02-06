import { SDNAClass, subjectProperty } from "@perspect3vism/ad4m";
import { EntryType } from "../../types";
import { ENTRY_TYPE } from "../../constants";

@SDNAClass({
  through: ENTRY_TYPE,
  initial: EntryType.Member,
  required: true,
})
export class Member {
  isSubjectInstance = ['languageName(Base, "agent-expression-store")'];
}

export default Member;
