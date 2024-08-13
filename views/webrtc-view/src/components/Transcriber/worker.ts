import { pipeline } from "@xenova/transformers";

let pipe;
let currentModel = "";
let transcribing = false;
const transcriptionQueue = [];
let embeddingsDict = {};
let embedder;
let currentNullVector = [];

async function initializePipeline(model) {
  return new Promise((resolve: any) => {
    currentModel = model;
    const modelName = `${model}${model === "distil-whisper/distil-large-v2" ? "" : ".en"}`;
    const revision = model.includes("-medium") ? "no_attentions" : "main";
    pipeline("automatic-speech-recognition", modelName, {
      quantized: true,
      revision,
    })
      .then((newPipe) => resolve(newPipe))
      .catch((error) => console.log("pipeline error", error));
  });
}

async function transcribe() {
  transcribing = true;
  const { id, float32Array, model } = transcriptionQueue[0];
  if (model !== currentModel) pipe = await initializePipeline(model);
  pipe(float32Array, { chunk_length_s: 30 }).then((result) => {
    transcriptionQueue.shift();
    if (transcriptionQueue.length) transcribe();
    else transcribing = false;
    postMessage({ id, text: result.text, type: "transcribe" });
  });
}

onmessage = async function (message) {
  if (message.data.type === "transcribe") {
    transcriptionQueue.push(message.data);
    if (!transcribing) transcribe();
  } else if (message.data.type === "similarity") {
    const { text } = message.data;
    const data = await embed(text);
    postMessage({ type: "similarity", text, embedding: data });
  }
};



async function embed(text: string, embedNewText=true) {
  if (!embedder) {
      embedder = await pipeline("feature-extraction", "TaylorAI/gte-tiny", {
          quantized: true,
      });
  }

  if (text in embeddingsDict) {
      return embeddingsDict[text];
  }

  if (embedNewText==false){
      if (currentNullVector.length !== 0){
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
