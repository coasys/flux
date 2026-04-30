// Energy-based VAD AudioWorklet processor.
// Accumulates speech utterances and posts them on silence gaps or max-length flush.
// Posts Float32Array (16 kHz PCM) per utterance instead of fixed 512-sample chunks.

// --- Default tunable parameters (can be overridden via port.postMessage) ---
const DEFAULTS = {
  speechOnsetThreshold: 0.08,    // RMS above this = speech candidate (well above ambient noise floor)
  silenceThreshold: 0.05,        // RMS below this = silence candidate
  onsetHoldFrames: 12,           // ~32ms at 2.67ms/frame — reject coughs/transients (< 30ms burst)
  silenceTimeoutFrames: 188,     // ~500ms at 128-sample frames @ 48 kHz
  maxUtteranceSamples: 480000,   // 30s at 16 kHz
  minUtteranceSamples: 8000,     // 500ms at 16 kHz — reject coughs/sighs/breaths
};

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

    // Pre-roll buffer: captures frames during onset detection so initial
    // phonemes aren't clipped when transitioning to SPEAKING.
    this.preRollBuffer = [];

    // Runtime-configurable thresholds (initialized from defaults)
    this.speechOnsetThreshold = DEFAULTS.speechOnsetThreshold;
    this.silenceThreshold = DEFAULTS.silenceThreshold;
    this.onsetHoldFrames = DEFAULTS.onsetHoldFrames;
    this.silenceTimeoutFrames = DEFAULTS.silenceTimeoutFrames;
    this.maxUtteranceSamples = DEFAULTS.maxUtteranceSamples;
    this.minUtteranceSamples = DEFAULTS.minUtteranceSamples;

    // Accept runtime threshold updates from main thread
    this.port.onmessage = (event) => {
      const cfg = event.data;
      if (cfg.speechOnsetThreshold !== undefined) this.speechOnsetThreshold = cfg.speechOnsetThreshold;
      if (cfg.silenceThreshold !== undefined) this.silenceThreshold = cfg.silenceThreshold;
      if (cfg.onsetHoldFrames !== undefined) this.onsetHoldFrames = cfg.onsetHoldFrames;
      if (cfg.silenceTimeoutFrames !== undefined) this.silenceTimeoutFrames = cfg.silenceTimeoutFrames;
      if (cfg.maxUtteranceSamples !== undefined) this.maxUtteranceSamples = cfg.maxUtteranceSamples;
      if (cfg.minUtteranceSamples !== undefined) this.minUtteranceSamples = cfg.minUtteranceSamples;
    };
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
    if (this.utteranceBuffer.length >= this.minUtteranceSamples) {
      // Compute average RMS of the utterance — reject if overall energy is too low
      // (prevents Whisper hallucinations like "you" on near-silent segments)
      const buf = this.utteranceBuffer;
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        sum += buf[i] * buf[i];
      }
      const avgRms = Math.sqrt(sum / buf.length);
      if (avgRms >= 0.04) {
        const utterance = new Float32Array(buf);
        this.port.postMessage(utterance);
      }
    }
    this.utteranceBuffer = [];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length === 0) {
      // Input went empty (mic disconnected / stream stopped) — flush any buffered speech
      if (this.utteranceBuffer.length > 0) {
        this.emitUtterance();
      }
      this.state = 'SILENT';
      this.onsetCounter = 0;
      this.silenceCounter = 0;
      this.preRollBuffer = [];
      return true;
    }

    const channelData = input[0];
    const downsampled = this.downsampleBuffer(
      channelData,
      this.originalSampleRate,
      this.targetSampleRate
    );

    const rms = this.computeRMS(channelData); // RMS on original-rate data for accuracy

    if (this.state === 'SILENT') {
      if (rms > this.speechOnsetThreshold) {
        // Accumulate into pre-roll while waiting for onset confirmation
        for (let i = 0; i < downsampled.length; i++) {
          this.preRollBuffer.push(downsampled[i]);
        }
        this.onsetCounter++;
        if (this.onsetCounter >= this.onsetHoldFrames) {
          // Transition to SPEAKING — prepend pre-roll to preserve initial phonemes
          this.state = 'SPEAKING';
          this.silenceCounter = 0;
          this.onsetCounter = 0;
          this.utteranceBuffer = this.preRollBuffer.concat(this.utteranceBuffer);
          this.preRollBuffer = [];
        }
      } else {
        this.onsetCounter = 0;
        this.preRollBuffer = [];
      }
    } else {
      // SPEAKING state
      for (let i = 0; i < downsampled.length; i++) {
        this.utteranceBuffer.push(downsampled[i]);
      }

      if (rms < this.silenceThreshold) {
        this.silenceCounter++;
        if (this.silenceCounter >= this.silenceTimeoutFrames) {
          // Silence gap detected — emit utterance
          this.emitUtterance();
          this.state = 'SILENT';
          this.silenceCounter = 0;
        }
      } else {
        this.silenceCounter = 0;
      }

      // Max utterance length guard (30s at 16 kHz)
      if (this.utteranceBuffer.length >= this.maxUtteranceSamples) {
        this.emitUtterance();
        // Stay in SPEAKING — speaker hasn't paused
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
