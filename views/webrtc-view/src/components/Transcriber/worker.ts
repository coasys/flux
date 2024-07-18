import { pipeline } from "@xenova/transformers";

onmessage = async function (message) {
  const { id, float32Array } = message.data;
  const pipe = await pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-tiny.en",
    { quantized: true }
  );
  const transcription = (await pipe(float32Array, {
    chunk_length_s: 30,
  })) as any;
  postMessage({ id, text: transcription.text });
};
