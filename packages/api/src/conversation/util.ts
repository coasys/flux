import { AIClient } from '@coasys/ad4m';
import { languages } from '@coasys/flux-constants';
import Embedding from '../embedding';
import SemanticRelationship from '../semantic-relationship';

const { EMBEDDING_VECTOR_LANGUAGE } = languages;
const showLogs = false; // Set to true to enable debug logs

async function findEmbeddingSRId(perspective, itemId): Promise<string | null> {
  try {
    const sparqlQuery = `
      SELECT ?relationship WHERE {
        ?relationship <flux://entry_type> <flux://has_semantic_relationship> .
        ?relationship <flux://has_expression> <${itemId}> .
        ?relationship <flux://has_tag> ?tagId .
        ?tagId <flux://entry_type> <flux://has_embedding> .
      }
      LIMIT 1
    `;

    const sparqlResult = await perspective.querySparql(sparqlQuery);
    return sparqlResult?.[0]?.relationship || null;
  } catch (error) {
    console.error('Error finding embedding SR:', error);
    return null;
  }
}

export async function removeEmbedding(perspective, itemId, batchId: string): Promise<void> {
  const embeddingSRId = await findEmbeddingSRId(perspective, itemId);
  if (embeddingSRId) {
    if (showLogs) console.log('embeddingSRId found:', embeddingSRId);
    const semanticRelationship = await new SemanticRelationship(perspective, embeddingSRId);
    const { tag } = await semanticRelationship.get();
    await Embedding.delete(perspective, tag, batchId);
    await SemanticRelationship.delete(perspective, embeddingSRId, batchId);
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
  index?: number,
): Promise<void> {
  // generate embedding
  const start1 = new Date().getTime();
  const rawEmbedding = await ai.embed('bert', text);
  const end1 = new Date().getTime();
  if (showLogs) console.log(`${index ? `Item ${index} e` : 'E'}mbedding created in ${duration(start1, end1)}`);
  // create embedding subject entity
  const start2 = new Date().getTime();
  const embeddingExpression = await perspective.createExpression(rawEmbedding, EMBEDDING_VECTOR_LANGUAGE);
  if (showLogs) console.log(`embeddingExpression for item ${index}:`, embeddingExpression);
  const embedding = await Embedding.create(perspective, { model: 'bert', embedding: embeddingExpression }, { batchId });
  const end2 = new Date().getTime();
  if (showLogs) console.log(`${index ? `Item ${index} e` : 'E'}mbedding saved in ${duration(start2, end2)}`);
  // create semantic relationship subject entity
  const start3 = new Date().getTime();
  await SemanticRelationship.create(
    perspective,
    { expression: itemId, tag: embedding.id },
    { batchId },
  );
  const end3 = new Date().getTime();
  if (showLogs) console.log(`${index ? `Item ${index}` : ''} SR saved in ${duration(start3, end3)}`);
}
