import { SDNAClass, SubjectFlag, SubjectProperty } from "@coasys/ad4m";

@SDNAClass({
  name: "SemanticRelationship",
})
export default class SemanticRelationship {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_semantic_relationship",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_expression",
    writable: true,
    resolveLanguage: "literal",
  })
  expression: string; // base url of expression

  @SubjectProperty({
    through: "flux://has_tag",
    writable: true,
    resolveLanguage: "literal",
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
