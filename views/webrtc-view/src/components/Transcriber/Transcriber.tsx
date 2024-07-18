import { useEffect, useRef, useState } from "preact/hooks";
import { v4 as uuidv4 } from "uuid";
import styles from "./Transcriber.module.css";
import TranscriptionWorker from "./worker?worker";

export default function Transcriber() {
  const [transcribeAudio, setTranscribeAudio] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [threshold, setThreshold] = useState(10);
  const [recordingTimeout, setRecordingTimeout] = useState(3);
  const [secondsOfSilence, setSecondsOfSilence] = useState(0);
  const thresholdRef = useRef(10);
  const recordingTimeoutRef = useRef(3);
  const silenceTimerRef = useRef(null);
  const silenceInterval = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const sourceNode = useRef(null);
  const recording = useRef(false);
  const listening = useRef(false);
  const worker = useRef<Worker | null>(null);

  function detectSpeech() {
    if (listening.current) {
      // detect max audio value
      analyser.current.getByteTimeDomainData(dataArray.current);
      const maxValue = Math.max(...dataArray.current);
      // update volume display
      const volume = document.getElementById("volume");
      volume.style.width = `${((maxValue - 128) / 128) * 100}%`;
      // if volume threshold reached
      if (maxValue > 128 + thresholdRef.current) {
        // clear silence timeout & interval if present
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
          clearInterval(silenceInterval.current);
          setSecondsOfSilence(0);
        }
        // start recording if not already started
        if (!recording.current) {
          audioChunks.current = [];
          mediaRecorder.current.start();
          recording.current = true;
          setSpeechDetected(true);
        }
      } else if (recording.current && !silenceTimerRef.current) {
        // start silence timeout
        silenceTimerRef.current = setTimeout(() => {
          mediaRecorder.current.stop();
          recording.current = false;
          silenceTimerRef.current = null;
          setSpeechDetected(false);
          clearInterval(silenceInterval.current);
          setSecondsOfSilence(0);
        }, recordingTimeoutRef.current * 1000);
        // increment seconds of silence
        setSecondsOfSilence(0);
        silenceInterval.current = setInterval(() => {
          setSecondsOfSilence((t) => t + 1);
        }, 1000);
      }
      requestAnimationFrame(detectSpeech);
    }
  }

  async function transcribe() {
    const id = uuidv4();
    setTranscripts((ts) => [...ts, { id, timestamp: new Date(), done: false }]);
    const arrayBuffer = await audioChunks.current[0].arrayBuffer();
    const context = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const float32Array = audioBuffer.getChannelData(0);
    worker.current?.postMessage({ id, float32Array });
    context.close();
  }

  function startListening() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContext.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      sourceNode.current = audioContext.current.createMediaStreamSource(stream);
      sourceNode.current.connect(analyser.current);
      analyser.current.fftSize = 2048;
      dataArray.current = new Uint8Array(analyser.current.fftSize);
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = transcribe;
      listening.current = true;
      detectSpeech();
    });
  }

  function stopListening() {
    listening.current = false;
    mediaRecorder.current?.stop();
    sourceNode.current?.disconnect();
    audioContext.current?.close();
  }

  function incrementTimeout(value) {
    const newValue = recordingTimeout + value;
    if (newValue >= 1 && newValue <= 10) {
      recordingTimeoutRef.current = newValue;
      setRecordingTimeout(newValue);
    }
  }

  useEffect(() => {
    // set up transcription worker to run ML in seperate thread (prevents UI from stalling)
    worker.current = new TranscriptionWorker();
    worker.current.onmessage = (e) => {
      const { id, text } = e.data;
      setTranscripts((ts) => {
        const match = ts.find((t) => t.id === id);
        match.text = text;
        match.done = true;
        return [...ts];
      });
    };
    return () => worker.current?.terminate();
  }, []);

  useEffect(() => {
    if (transcribeAudio) startListening();
    else stopListening();
  }, [transcribeAudio]);

  return (
    <div className={styles.wrapper}>
      <j-flex a="center" gap="400">
        <j-text nomargin>Transcribe Audio</j-text>
        <j-toggle
          checked={transcribeAudio}
          onChange={() => setTranscribeAudio(!transcribeAudio)}
        >
          {transcribeAudio ? "ON" : "OFF"}
        </j-toggle>
      </j-flex>
      {transcribeAudio && (
        <j-box mt="200" mb="600">
          <j-flex a="center" gap="400">
            <j-text nomargin style={{ flexShrink: 0 }}>
              Volume Threshold
            </j-text>
            <div className={styles.volumeThreshold}>
              <div id="volume" className={styles.volume} />
              <div
                className={styles.threshold}
                style={{ left: `${(+threshold / 128) * 100}%` }}
              />
              <input
                className={styles.slider}
                type="range"
                min="0"
                max="128"
                value={threshold}
                onChange={(e) => {
                  thresholdRef.current = +e.target.value;
                  setThreshold(+e.target.value);
                }}
              />
            </div>
          </j-flex>
          <j-box mt="400">
            <j-flex a="center" gap="400">
              <j-text nomargin>
                Seconds of silence before recording stops
              </j-text>
              <j-button size="xs" square onClick={() => incrementTimeout(-1)}>
                <j-icon name="caret-left-fill" />
              </j-button>
              <j-text nomargin>{recordingTimeout}</j-text>
              <j-button size="xs" square onClick={() => incrementTimeout(1)}>
                <j-icon name="caret-right-fill" />
              </j-button>
            </j-flex>
          </j-box>
          <j-box mt="400">
            <j-flex a="center" gap="400">
              <j-text nomargin>State:</j-text>
              <j-text color="color-white" nomargin>
                {speechDetected ? "Recording!" : "Listening for speech..."}
              </j-text>
              {secondsOfSilence > 0 && (
                <j-text nomargin>
                  (stopping in {recordingTimeout - secondsOfSilence}s)
                </j-text>
              )}
            </j-flex>
          </j-box>
        </j-box>
      )}
      {transcripts.length > 0 && (
        <j-flex direction="column" gap="400">
          {transcripts.map((transcript) => (
            <j-flex
              key={transcript.id}
              direction="column"
              gap="300"
              className={styles.text}
            >
              <j-timestamp
                value={transcript.timestamp}
                dateStyle="short"
                timeStyle="short"
              />
              {transcript.done ? (
                <j-text nomargin size="600">
                  {transcript.text}
                </j-text>
              ) : (
                <j-flex gap="400" a="center">
                  <j-spinner size="xs" />
                  <j-text nomargin size="600" color="primary-600">
                    Transcribing audio...
                  </j-text>
                </j-flex>
              )}
            </j-flex>
          ))}
        </j-flex>
      )}
    </div>
  );
}
