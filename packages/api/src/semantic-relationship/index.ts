import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "SemanticRelationship",
})
export default class SemanticRelationship extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_semantic_relationship",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_expression",
    writable: true,
  })
  expression: string; // base url of expression

  @SubjectProperty({
    through: "flux://has_tag",
    writable: true,
    required: false,
  })
  tag: string; // base url of semantic tag

  @SubjectProperty({
    through: "flux://has_relevance",
    writable: true,
    resolveLanguage: "literal",
  })
  relevance: number; // 0 - 100
}
