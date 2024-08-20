import { cos_sim, pipeline } from "@xenova/transformers";

let embeddingsDict = {};
let embedder;
let currentNullVector: any[] = [];

onmessage = async function (message) {
  if (message.data.type === "embed") {
    const { text, messageId } = message.data;
    const data = await embed(text);
    postMessage({ type: "embed", text, embedding: data, messageId });
  } else if (message.data.type === "similarity") {
    const { items, sourceEmbedding } = message.data;
    const itemsWithSimilarity = await Promise.all(
      items.map(async (item) => {
        const similarity = await cos_sim(sourceEmbedding, item.embedding);
        return { ...item, similarity };
      })
    );
    const filteredItems = itemsWithSimilarity.filter(
      (item) => item.similarity > 0.8
    );
    postMessage({ type: "similarity", items: filteredItems });
  }
};

async function embed(text: string, embedNewText = true) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "TaylorAI/gte-tiny", {
      quantized: true,
    });
  }

  if (text in embeddingsDict) {
    return embeddingsDict[text];
  }

  if (embedNewText == false) {
    if (currentNullVector.length !== 0) {
      embeddingsDict[text] = currentNullVector;
      return currentNullVector;
    } else {
      const tempVec = await embedder("test", {
        pooling: "mean",
        normalize: true,
      });
      currentNullVector = [...tempVec.data].fill(0.00001);
      embeddingsDict[text] = currentNullVector;
      return currentNullVector;
    }
  }

  const e0 = await embedder(text, { pooling: "mean", normalize: true });

  const roundDecimalsDown = (num) => parseFloat(num.toFixed(3));

  embeddingsDict[text] = e0.data.map(roundDecimalsDown);

  return e0.data;
}
