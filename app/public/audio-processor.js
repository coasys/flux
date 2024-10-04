class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
      super();
      this.buffer = [];
      this.chunkSize = 512;
      this.originalSampleRate = sampleRate;
      this.targetSampleRate = 16000;
  }

  downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
      const sampleRateRatio = inputSampleRate / outputSampleRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      let offsetResult = 0;
      let offsetBuffer = 0;

      while (offsetResult < result.length) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          let accum = 0, count = 0;
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

  process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input.length > 0) {
          const channelData = input[0];
          const downsampledData = this.downsampleBuffer(channelData, this.originalSampleRate, this.targetSampleRate);

          // Append the downsampled data to the buffer
          this.buffer.push(...downsampledData);

          // When the buffer reaches the chunk size, send the data
          if (this.buffer.length >= this.chunkSize) {
              const float32ArrayToSend = new Float32Array(this.buffer.slice(0, this.chunkSize));
              this.port.postMessage(float32ArrayToSend);

              // Remove the sent data from the buffer
              this.buffer = this.buffer.slice(this.chunkSize);
          }
      }
      return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
