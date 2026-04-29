// Energy-based VAD AudioWorklet processor.
// Accumulates speech utterances and posts them on silence gaps or max-length flush.
// Posts Float32Array (16 kHz PCM) per utterance instead of fixed 512-sample chunks.

// --- Tunable parameters ---
const SPEECH_ONSET_THRESHOLD = 0.01;   // RMS above this = speech candidate
const SILENCE_THRESHOLD = 0.008;       // RMS below this = silence candidate
const ONSET_HOLD_FRAMES = 3;           // ~8ms/frame → ~24ms hold to avoid clicks
const SILENCE_TIMEOUT_FRAMES = 188;    // ~500ms at 128-sample frames @ 48 kHz (~2.67ms/frame)
const MAX_UTTERANCE_SAMPLES = 480000;  // 30s at 16 kHz

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.originalSampleRate = sampleRate;
    this.targetSampleRate = 16000;

    // Utterance accumulation buffer (16 kHz samples)
    this.utteranceBuffer = [];

    // VAD state machine
    this.state = 'SILENT'; // 'SILENT' | 'SPEAKING'
    this.onsetCounter = 0;
    this.silenceCounter = 0;
  }

  downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0,
        count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  computeRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  emitUtterance() {
    if (this.utteranceBuffer.length > 0) {
      const utterance = new Float32Array(this.utteranceBuffer);
      this.port.postMessage(utterance);
      this.utteranceBuffer = [];
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length === 0) return true;

    const channelData = input[0];
    const downsampled = this.downsampleBuffer(
      channelData,
      this.originalSampleRate,
      this.targetSampleRate
    );

    const rms = this.computeRMS(channelData); // RMS on original-rate data for accuracy

    if (this.state === 'SILENT') {
      if (rms > SPEECH_ONSET_THRESHOLD) {
        this.onsetCounter++;
        if (this.onsetCounter >= ONSET_HOLD_FRAMES) {
          // Transition to SPEAKING
          this.state = 'SPEAKING';
          this.silenceCounter = 0;
          this.onsetCounter = 0;
        }
      } else {
        this.onsetCounter = 0;
      }

      // If we just transitioned, start accumulating from this frame
      if (this.state === 'SPEAKING') {
        for (let i = 0; i < downsampled.length; i++) {
          this.utteranceBuffer.push(downsampled[i]);
        }
      }
    } else {
      // SPEAKING state
      for (let i = 0; i < downsampled.length; i++) {
        this.utteranceBuffer.push(downsampled[i]);
      }

      if (rms < SILENCE_THRESHOLD) {
        this.silenceCounter++;
        if (this.silenceCounter >= SILENCE_TIMEOUT_FRAMES) {
          // Silence gap detected — emit utterance
          this.emitUtterance();
          this.state = 'SILENT';
          this.silenceCounter = 0;
        }
      } else {
        this.silenceCounter = 0;
      }

      // Max utterance length guard (30s at 16 kHz)
      if (this.utteranceBuffer.length >= MAX_UTTERANCE_SAMPLES) {
        this.emitUtterance();
        // Stay in SPEAKING — speaker hasn't paused
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
