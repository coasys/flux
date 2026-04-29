/**
 * Feed an audio utterance (from the VAD AudioWorklet) to transcription streams.
 *
 * Sends raw binary Float32Array to the executor, which returns SSE partial text.
 * The `await` provides natural backpressure — the next utterance waits for
 * the server to finish processing this one.
 *
 * @param client - Ad4mClient instance (or any object with `client.ai.feedTranscriptionStream`)
 * @param streamIds - Active transcription stream IDs (fast + quality)
 * @param utterance - Raw 16 kHz PCM Float32Array from the AudioWorklet
 */
export async function feedUtterance(
  client: { ai: { feedTranscriptionStream(streamIds: string[], audio: Float32Array): Promise<void> } },
  streamIds: (string | null | undefined)[],
  utterance: Float32Array
): Promise<void> {
  const ids = streamIds.filter(Boolean) as string[];
  if (ids.length === 0 || utterance.length === 0) return;

  try {
    await client.ai.feedTranscriptionStream(ids, utterance);
  } catch (e) {
    console.error('[feedUtterance] error:', e);
  }
}
