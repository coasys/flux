import { SDNAClass, SubjectProperty, SubjectFlag } from "@coasys/ad4m";

@SDNAClass({
  name: "NillionUserUser",
})
export default class NillionUser {
  @SubjectFlag({
    through: "flux://entry_type",
    writable: true,
    value: "flux://nillion_user",
  })
  type: String;

  @SubjectProperty({
    through: "flux://nillion_user_id",
    writable: true,
    resolveLanguage: "literal",
  })
  userId: String;
}
