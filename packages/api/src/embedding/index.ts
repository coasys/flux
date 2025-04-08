import { ModelOptions, Ad4mModel, Flag, Property } from "@coasys/ad4m";
import { languages } from "@coasys/flux-constants";
const { EMBEDDING_VECTOR_LANGUAGE } = languages;

@ModelOptions({
  name: "Embedding",
})
export default class Embedding extends Ad4mModel {
  @Flag({
    through: "flux://entry_type",
    value: "flux://has_embedding",
  })
  type: string;

  @Property({
    through: "flux://embedding",
    writable: true,
  })
  embedding: any;

  @Property({
    through: "flux://model",
    writable: true,
    resolveLanguage: "literal",
  })
  model: string;
}
