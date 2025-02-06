import { AIClient } from "@coasys/ad4m";
import Embedding from "../embedding";
import SemanticRelationship from "../semantic-relationship";

async function findEmbeddingSRId(perspective, itemId) {
  const result = await perspective.infer(`
    findall(Relationship, (
      % 1. Find SemanticRelationship connected to item
      subject_class("SemanticRelationship", SR),
      instance(SR, Relationship),
      property_getter(SR, Relationship, "expression", "${itemId}"),
      
      % 2. Get tag and check it's an Embedding
      property_getter(SR, Relationship, "tag", TagId),
      subject_class("Embedding", E),
      instance(E, TagId)
    ), [Result]).
  `);

  return result[0]?.Result || null;
}

export async function removeEmbedding(perspective, itemId) {
  const embeddingSRId = await findEmbeddingSRId(perspective, itemId);
  if (embeddingSRId) {
    const semanticRelationship = await new SemanticRelationship(perspective, embeddingSRId).get();
    const embedding = await new Embedding(perspective, semanticRelationship.tag).get();
    await embedding.delete();
    await semanticRelationship.delete();
  }
}

// todo: use embedding language instead of stringifying
export async function createEmbedding(perspective, text, itemId, ai: AIClient) {
  // generate embedding
  const rawEmbedding = await ai.embed("bert", text);
  // create embedding subject entity
  const embedding = new Embedding(perspective, undefined, itemId);
  embedding.model = "bert";
  embedding.embedding = JSON.stringify(rawEmbedding);
  await embedding.save();
  // create semantic relationship subject entity
  const relationship = new SemanticRelationship(perspective, undefined, itemId);
  relationship.expression = itemId;
  relationship.tag = embedding.baseExpression;
  await relationship.save();
}
