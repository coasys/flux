import { env, pipeline } from "@xenova/transformers";
env.allowLocalModels = true;
env.localModelPath = "/models/";

onmessage = async function (message) {
  const { id, float32Array, model } = message.data;
  const pipe = (await pipeline("automatic-speech-recognition", model, {
    quantized: true,
    // revision: model.includes("whisper-medium") ? "no_attentions" : "main",
  })) as any;
  const transcription = (await pipe(float32Array, {
    chunk_length_s: 30,
  })) as any;
  postMessage({ id, text: transcription.text });
};
