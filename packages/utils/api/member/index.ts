import { sdnaOutput } from "@perspect3vism/ad4m";
class Member {
  isSubjectInstance = ['languageName(this, "did")']

  @sdnaOutput
  static generateSdna(): string { return "" }
}

export default Member;
