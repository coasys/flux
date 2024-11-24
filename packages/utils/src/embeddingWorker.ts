import { cos_sim } from "@xenova/transformers";

onmessage = async function (message) {
  const { items, sourceEmbedding } = message.data;
  const itemsWithSimilarity = await Promise.all(
    items.map(async (item) => {
      const score = await cos_sim(sourceEmbedding, item.embedding);
      return { ...item, score };
    })
  );
  const filteredItems = itemsWithSimilarity.filter((item) => item.score > 0.2);
  postMessage(filteredItems);
};
