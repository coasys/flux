import { ModelOptions, Property, Flag, Ad4mModel } from "@coasys/ad4m";

@ModelOptions({
  name: "NillionUserUser",
})
export default class NillionUser extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    writable: true,
    value: "flux://nillion_user",
  })
  type: String;

  @Property({
    through: "flux://nillion_user_id",
    writable: true,
    resolveLanguage: "literal",
  })
  userId: String;
}
