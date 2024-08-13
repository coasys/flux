import { pipeline } from "@xenova/transformers";

let pipe;
let currentModel = "";
let transcribing = false;
const transcriptionQueue = [];

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
    postMessage({ id, text: result.text });
  });
}

onmessage = async function (message) {
  transcriptionQueue.push(message.data);
  if (!transcribing) transcribe();
};
