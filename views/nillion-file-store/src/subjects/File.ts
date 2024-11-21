import { SDNAClass, SubjectProperty, SubjectFlag } from "@coasys/ad4m";

@SDNAClass({
  name: "NillionFile",
})
export default class File {
  @SubjectFlag({
    through: "flux://entry_type",
    writable: true,
    value: "flux://has_file",
  })
  type: String;

  @SubjectProperty({
    through: "flux://secretId",
    writable: true,
    resolveLanguage: "literal",
  })
  secretId: String;

  @SubjectProperty({
    through: "flux://fileSize",
    writable: true,
    resolveLanguage: "literal",
  })
  size: String;

  @SubjectProperty({
    through: "flux://storeId",
    writable: true,
    resolveLanguage: "literal",
  })
  storeId: String;

  @SubjectProperty({
    through: "flux://file_name",
    writable: true,
    resolveLanguage: "literal",
  })
  name: String;
}
