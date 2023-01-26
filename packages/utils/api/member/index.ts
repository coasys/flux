import { sdnaOutput, subjectProperty } from "@perspect3vism/ad4m";
import { EntryType } from "../../types";
import { ENTRY_TYPE } from "../../constants";

export class Member {
  isSubjectInstance = ['languageName(Base, "agent-expression-store")'];

  @subjectProperty({
    through: ENTRY_TYPE,
    initial: EntryType.Member,
    required: true,
  })
  type: string;

  @sdnaOutput
  static generateSDNA(): string {
    return "";
  }
}

export default Member;
