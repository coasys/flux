/**
 * Tests for the AudioWorklet-based VAD audio processor.
 *
 * The processor lives in app/public/audio-processor.js as a plain JS
 * AudioWorkletProcessor.  We simulate the worklet environment here so we
 * can exercise the state machine, pre-roll, and gating logic without a
 * real AudioContext.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---- AudioWorklet shim ----
const posted: Float32Array[] = [];
let CapturedProcessor: any = null;

(globalThis as any).sampleRate = 48000;
(globalThis as any).AudioWorkletProcessor = class {
  port = {
    postMessage: (data: any) => posted.push(data),
    onmessage: null as any,
  };
};
(globalThis as any).registerProcessor = (_name: string, cls: any) => {
  CapturedProcessor = cls;
};

// Load the processor module — registerProcessor captures the class
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(
  path.resolve(__dirname, '../../public/audio-processor.js'),
  'utf8'
);
// Execute in this global scope so the shims are visible
const fn = new Function(code);
fn();

function makeProcessor(): any {
  posted.length = 0;
  return new CapturedProcessor();
}

/** Create a Float32Array filled with a given constant value. */
function constantBuffer(length: number, value: number): Float32Array {
  const buf = new Float32Array(length);
  buf.fill(value);
  return buf;
}

/** Create a sine-wave buffer at the given frequency. */
function sineBuffer(length: number, freq: number, amp: number, sr: number): Float32Array {
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / sr);
  }
  return buf;
}

/** Simulate one process() call with the given channel data. */
function feed(proc: any, channelData: Float32Array) {
  proc.process([[channelData]], [], {});
}

/** Feed multiple frames of the same data. */
function feedN(proc: any, channelData: Float32Array, n: number) {
  for (let i = 0; i < n; i++) {
    feed(proc, channelData);
  }
}

describe('audio-processor VAD', () => {
  it('stays silent on zero-energy input', () => {
    const proc = makeProcessor();
    const silence = constantBuffer(128, 0);
    feedN(proc, silence, 300);
    expect(posted.length).toBe(0);
    expect(proc.state).toBe('SILENT');
  });

  it('transitions to SPEAKING after onsetHoldFrames of loud input', () => {
    const proc = makeProcessor();
    const loud = sineBuffer(128, 440, 0.5, 48000);
    // Feed exactly onsetHoldFrames frames
    feedN(proc, loud, proc.onsetHoldFrames);
    expect(proc.state).toBe('SPEAKING');
  });

  it('does not transition to SPEAKING before onsetHoldFrames', () => {
    const proc = makeProcessor();
    const loud = sineBuffer(128, 440, 0.5, 48000);
    feedN(proc, loud, proc.onsetHoldFrames - 1);
    expect(proc.state).toBe('SILENT');
  });

  it('resets onset counter on silence gap', () => {
    const proc = makeProcessor();
    const loud = sineBuffer(128, 440, 0.5, 48000);
    const silence = constantBuffer(128, 0);
    // Almost trigger onset
    feedN(proc, loud, proc.onsetHoldFrames - 1);
    expect(proc.state).toBe('SILENT');
    // Silence resets counter
    feed(proc, silence);
    expect(proc.onsetCounter).toBe(0);
    // Start again — need full hold to trigger
    feedN(proc, loud, proc.onsetHoldFrames - 1);
    expect(proc.state).toBe('SILENT');
  });

  it('emits utterance on silence timeout while SPEAKING', () => {
    const proc = makeProcessor();
    const loud = sineBuffer(128, 440, 0.5, 48000);
    const silence = constantBuffer(128, 0);

    // Trigger speech
    feedN(proc, loud, proc.onsetHoldFrames);
    expect(proc.state).toBe('SPEAKING');

    // Feed enough loud frames to exceed minUtteranceSamples
    // Each frame at 48kHz/128 samples downsampled to 16kHz ≈ 42.67 samples
    const framesForMin = Math.ceil(proc.minUtteranceSamples / (128 * 16000 / 48000)) + 1;
    feedN(proc, loud, framesForMin);

    // Now feed silence until timeout
    feedN(proc, silence, proc.silenceTimeoutFrames);
    expect(proc.state).toBe('SILENT');
    expect(posted.length).toBeGreaterThanOrEqual(1);
    expect(posted[0]).toBeInstanceOf(Float32Array);
  });

  it('rejects short utterances below minUtteranceSamples', () => {
    const proc = makeProcessor();
    const loud = sineBuffer(128, 440, 0.5, 48000);
    const silence = constantBuffer(128, 0);

    // Disable pre-roll so we can control exactly how much audio lands in the buffer
    proc.preRollSamples = 0;
    proc.preRollBuffer = [];

    // Trigger speech onset
    feedN(proc, loud, proc.onsetHoldFrames);
    // Feed only 1 frame of actual speech — well below minUtteranceSamples (8000)
    feedN(proc, loud, 1);
    // Silence timeout
    feedN(proc, silence, proc.silenceTimeoutFrames);
    expect(proc.state).toBe('SILENT');
    // Should NOT have emitted (too short)
    expect(posted.length).toBe(0);
  });

  it('rejects utterances with very low average RMS', () => {
    const proc = makeProcessor();
    // Use very quiet audio that's above onset threshold at original rate
    // but has low overall RMS after accumulation
    const barelyAudible = constantBuffer(128, 0.09); // just above onset threshold 0.08

    feedN(proc, barelyAudible, proc.onsetHoldFrames);
    expect(proc.state).toBe('SPEAKING');

    // Feed enough to exceed minUtteranceSamples
    const framesForMin = Math.ceil(proc.minUtteranceSamples / (128 * 16000 / 48000)) + 50;
    feedN(proc, barelyAudible, framesForMin);

    // The downsampled RMS should be very low — each sample ≈ 0.09
    // avgRms of constant 0.09 = 0.09, which is >= 0.04 so this will actually pass.
    // Use an even quieter signal to test the gate:
    posted.length = 0;
    const proc2 = makeProcessor();
    const veryQuiet = constantBuffer(128, 0.02); // RMS = 0.02 < 0.04

    // Lower threshold temporarily so onset triggers
    proc2.speechOnsetThreshold = 0.01;
    feedN(proc2, veryQuiet, proc2.onsetHoldFrames);
    const framesForMin2 = Math.ceil(proc2.minUtteranceSamples / (128 * 16000 / 48000)) + 50;
    feedN(proc2, veryQuiet, framesForMin2);
    const silence = constantBuffer(128, 0);
    feedN(proc2, silence, proc2.silenceTimeoutFrames);

    // avgRms ≈ 0.02 which is < 0.04 gate → should be rejected
    expect(posted.length).toBe(0);
  });

  it('pre-roll buffer captures 500ms of context before speech', () => {
    const proc = makeProcessor();
    // The preRollSamples should be 8000 (500ms at 16kHz)
    expect(proc.preRollSamples).toBe(8000);

    const quiet = constantBuffer(128, 0.01); // below onset threshold
    const loud = sineBuffer(128, 440, 0.5, 48000);  // above onset threshold

    // Feed many quiet frames — pre-roll keeps rolling
    feedN(proc, quiet, 500);
    expect(proc.preRollBuffer.length).toBeLessThanOrEqual(proc.preRollSamples);
    expect(proc.preRollBuffer.length).toBeGreaterThan(0);
    expect(proc.state).toBe('SILENT');

    // Record pre-roll size just before onset
    const preRollBefore = proc.preRollBuffer.length;

    // Trigger speech onset
    feedN(proc, loud, proc.onsetHoldFrames);
    expect(proc.state).toBe('SPEAKING');

    // The utterance buffer should start with the pre-roll content
    expect(proc.utteranceBuffer.length).toBeGreaterThanOrEqual(preRollBefore);
  });

  it('pre-roll buffer is capped at preRollSamples', () => {
    const proc = makeProcessor();
    const quiet = constantBuffer(128, 0.01);

    // Feed many frames while SILENT
    feedN(proc, quiet, 10000);
    expect(proc.preRollBuffer.length).toBeLessThanOrEqual(proc.preRollSamples);
  });

  it('flushes on empty input (mic disconnect)', () => {
    const proc = makeProcessor();
    const loud = sineBuffer(128, 440, 0.5, 48000);

    // Trigger speech and accumulate data
    feedN(proc, loud, proc.onsetHoldFrames);
    const framesForMin = Math.ceil(proc.minUtteranceSamples / (128 * 16000 / 48000)) + 50;
    feedN(proc, loud, framesForMin);
    expect(proc.state).toBe('SPEAKING');

    // Simulate mic disconnect (empty input array)
    proc.process([[]], [], {});
    // Should have flushed + reset
    expect(proc.state).toBe('SILENT');
    expect(posted.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts runtime threshold updates via port.onmessage', () => {
    const proc = makeProcessor();
    expect(proc.speechOnsetThreshold).toBe(0.08);

    proc.port.onmessage({ data: { speechOnsetThreshold: 0.15, preRollSamples: 4000 } });
    expect(proc.speechOnsetThreshold).toBe(0.15);
    expect(proc.preRollSamples).toBe(4000);
  });
});
