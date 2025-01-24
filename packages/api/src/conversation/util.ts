import { getAd4mClient } from "@coasys/ad4m-connect";
import Embedding from "../embedding";
import SemanticRelationship from "../semantic-relationship";

export async function removeEmbedding(perspective, itemId) {
    const allSemanticRelationships = (await SemanticRelationship.query(perspective, {
      source: itemId,
    })) as any;
    const embeddingSR = allSemanticRelationships.find((sr) => !sr.relevance);
    if (embeddingSR) {
      const embedding = new Embedding(perspective, embeddingSR.tag);
      await embedding.delete(); // delete the embedding
      await embeddingSR.delete(); // delete the semantic relationship
    }
  }
  
// todo: use embedding language instead of stringifying
export async function createEmbedding(perspective, text, itemId) {
    // generate embedding
    const client = await getAd4mClient();
    const rawEmbedding = await client.ai.embed("bert", text);
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