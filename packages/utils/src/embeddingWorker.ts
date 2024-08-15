import { pipeline, cos_sim } from "@xenova/transformers";

let embeddingsDict = {};
let embedder;
let currentNullVector: any[] = [];

onmessage = async function (message) {
    if (message.data.type === "embed") {
        const { text, messageId } = message.data;
        const data = await embed(text);
        postMessage({ type: "embed", text, embedding: data, messageId });
    } else if(message.data.type === "query-embed") {
        const { text, messageId } = message.data;
        const data = await embed(text);
        postMessage({ type: "query-embed", text, embedding: data, messageId });
    } else if (message.data.type === "similarity") {
        const messages = message.data.messages;
        const resolvedMessages = await Promise.all(messages.map(async (m) => {
            const queryEmbedding = await embed("food");
            const embedding = await embed(m.body);
            console.log('embedding', embedding, m.embedding, queryEmbedding);
            const similarity = await cos_sim(queryEmbedding, embedding);
            m.similarity = similarity;
            return m;
        }))

        resolvedMessages.sort((a, b) => b.similarity - a.similarity);

        const messagesPrecision = resolvedMessages
            .filter(m => !Number.isNaN(m.similarity))
            .map((m) => ({ ...m, similarity: m.similarity.toFixed(3) }));

        postMessage({ type: "similarity", messages: messagesPrecision });
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
            return currentNullVector
        }
        else {
            const tempVec = await embedder("test", { pooling: 'mean', normalize: true });
            currentNullVector = [...tempVec.data].fill(0.00001);
            embeddingsDict[text] = currentNullVector;
            return currentNullVector
        }
    }

    const e0 = await embedder(text, { pooling: 'mean', normalize: true });

    const roundDecimalsDown = (num) => parseFloat(num.toFixed(3));

    embeddingsDict[text] = e0.data.map(roundDecimalsDown);

    return e0.data;
}
