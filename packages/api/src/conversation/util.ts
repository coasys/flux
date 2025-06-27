import { AIClient } from "@coasys/ad4m";
import { languages } from "@coasys/flux-constants";
import Embedding from "../embedding";
import SemanticRelationship from "../semantic-relationship";

const { EMBEDDING_VECTOR_LANGUAGE } = languages;
const showLogs = false; // Set to true to enable debug logs

async function findEmbeddingSRId(perspective, itemId): Promise<string | null> {
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

export async function removeEmbedding(perspective, itemId, batchId: string): Promise<void> {
  const embeddingSRId = await findEmbeddingSRId(perspective, itemId);
  if (embeddingSRId) {
    if (showLogs) console.log("embeddingSRId found:", embeddingSRId);
    const semanticRelationship = await new SemanticRelationship(perspective, embeddingSRId);
    const { tag } = await semanticRelationship.get();
    const embedding = new Embedding(perspective, tag);
    await embedding.delete(batchId);
    await semanticRelationship.delete(batchId);
  }
}

function duration(start, end) {
  return `${(end - start) / 1000} secs`;
}

// todo: use embedding language instead of stringifying
export async function createEmbedding(
  perspective,
  text,
  itemId,
  ai: AIClient,
  batchId: string,
  index?: number
): Promise<void> {
  // generate embedding
  const start1 = new Date().getTime();
  const rawEmbedding = await ai.embed("bert", text);
  const end1 = new Date().getTime();
  if (showLogs) console.log(`${index ? `Item ${index} e` : "E"}mbedding created in ${duration(start1, end1)}`);
  // create embedding subject entity
  const start2 = new Date().getTime();
  const embedding = new Embedding(perspective, undefined, itemId);
  embedding.model = "bert";
  const embeddingExpression = await perspective.createExpression(rawEmbedding, EMBEDDING_VECTOR_LANGUAGE);
  if (showLogs) console.log(`embeddingExpression for item ${index}:`, embeddingExpression);
  embedding.embedding = embeddingExpression;
  await embedding.save(batchId);
  const end2 = new Date().getTime();
  if (showLogs) console.log(`${index ? `Item ${index} e` : "E"}mbedding saved in ${duration(start2, end2)}`);
  // create semantic relationship subject entity
  const start3 = new Date().getTime();
  const relationship = new SemanticRelationship(perspective, undefined, itemId);
  relationship.expression = itemId;
  relationship.tag = embedding.baseExpression;
  await relationship.save(batchId);
  const end3 = new Date().getTime();
  if (showLogs) console.log(`${index ? `Item ${index}` : ""} SR saved in ${duration(start3, end3)}`);
}
