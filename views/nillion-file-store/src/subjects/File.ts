import { ModelOptions, Property, Flag, Ad4mModel } from "@coasys/ad4m";

@ModelOptions({
  name: "NillionFile",
})
export default class File extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    writable: true,
    value: "flux://has_file",
  })
  type: String;

  @Property({
    through: "flux://secretId",
    writable: true,
    resolveLanguage: "literal",
  })
  secretId: String;

  @Property({
    through: "flux://fileSize",
    writable: true,
    resolveLanguage: "literal",
  })
  size: String;

  @Property({
    through: "flux://storeId",
    writable: true,
    resolveLanguage: "literal",
  })
  storeId: String;

  @Property({
    through: "flux://file_name",
    writable: true,
    resolveLanguage: "literal",
  })
  name: String;
}
