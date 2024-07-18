import { pipeline } from "@xenova/transformers";

onmessage = async function (message) {
  const { id, float32Array, model } = message.data;
  const pipe = await pipeline(
    "automatic-speech-recognition",
    `${model}${model === "distil-whisper/distil-large-v2" ? "" : ".en"}`,
    {
      quantized: true,
      revision: model.includes("whisper-medium") ? "no_attentions" : "main",
    }
  );
  const transcription = (await pipe(float32Array, {
    chunk_length_s: 30,
  })) as any;
  postMessage({ id, text: transcription.text });
};
