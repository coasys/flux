import { env, pipeline } from "@xenova/transformers";
env.localModelPath = "/models/";

let pipe;
let currentModel = "";
let transcribing = false;
const transcriptionQueue = [];

async function initializePipeline(model) {
  return new Promise((resolve: any) => {
    currentModel = model;
    pipeline("automatic-speech-recognition", model, { quantized: true })
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
