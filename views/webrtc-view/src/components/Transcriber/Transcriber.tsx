import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message } from "@coasys/flux-api";
import { getAllTopics, processItem, set } from "@coasys/flux-utils";
import TranscriptionWorker from "@coasys/flux-utils/src/transcriptionWorker?worker&inline";
import { useEffect, useRef, useState } from "preact/hooks";
import { v4 as uuidv4 } from "uuid";
import styles from "./Transcriber.module.css";

const defaultVolumeThreshold = 40; // 0 - 128
const defaultSilenceTimeout = 3; // seconds
const models = [
  "Xenova/whisper-tiny",
  "Xenova/whisper-base",
  // "Xenova/whisper-small",
  // "Xenova/whisper-medium",
  // "distil-whisper/distil-medium",
  // "distil-whisper/distil-large-v2",
];

type Props = {
  source: string;
  perspective: any;
  muted: boolean;
};

export default function Transcriber({ source, perspective, muted }: Props) {
  const [openAIKey, setOpenAIKey] = useState(
    localStorage?.getItem("openAIKey") || ""
  );
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [transcribeAudio, setTranscribeAudio] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [volumeThreshold, setVolumeThreshold] = useState(
    defaultVolumeThreshold
  );
  const volumeThresholdRef = useRef(defaultVolumeThreshold);
  const [silenceTimeout, setSilenceTimeout] = useState(defaultSilenceTimeout);
  const silenceTimeoutRef = useRef(defaultSilenceTimeout);
  const [secondsOfSilence, setSecondsOfSilence] = useState(0);
  const silenceTimerRef = useRef(null);
  const silenceInterval = useRef(null);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const selectedModelRef = useRef(models[0]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const sourceNode = useRef(null);
  const recording = useRef(false);
  const listening = useRef(false);
  const transcriptionWorker = useRef<Worker | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const currentTransciptsId = useRef(null);

  const { repo: messageRepo } = useSubjects({
    perspective,
    source,
    subject: Message,
  });

  function detectSpeech() {
    if (listening.current) {
      // detect max audio value
      analyser.current.getByteTimeDomainData(dataArray.current);
      const maxValue = Math.max(...dataArray.current);
      // update volume display
      const volume = document.getElementById("volume");
      if (volume) volume.style.width = `${((maxValue - 128) / 128) * 100}%`;
      // if volume threshold reached
      if (maxValue > 128 + volumeThresholdRef.current) {
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
        }, silenceTimeoutRef.current * 1000);
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
    // convert raw audio to float32Array for transcription
    const arrayBuffer = await audioChunks.current[0].arrayBuffer();
    const context = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const float32Array = audioBuffer.getChannelData(0);
    // send formatted audio to transcription worker
    transcriptionWorker.current?.postMessage({
      id,
      float32Array,
      model: selectedModelRef.current,
      type: "transcribe",
    });
    context.close();
  }

  function startListening() {
    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
        audioContext.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyser.current = audioContext.current.createAnalyser();
        sourceNode.current =
          audioContext.current.createMediaStreamSource(stream);
        sourceNode.current.connect(analyser.current);
        analyser.current.fftSize = 2048;
        dataArray.current = new Uint8Array(analyser.current.fftSize);
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
          if (mediaRecorder.current?.state === 'inactive') {
            // @ts-ignore
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
              transcribe();
            }
          }
        };
        // mediaRecorder.current.onstop = transcribe;

        // @ts-ignore
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
          // @ts-ignore
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          let noTextTimeoutId: NodeJS.Timeout;

          recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                final += result[0].transcript;
              } else {
                interim += result[0].transcript;
                if (!currentTransciptsId.current) {
                  const id = uuidv4();
                  currentTransciptsId.current = id;
                  setTranscripts((ts) => [...ts, { id, text: interim, timestamp: new Date(), done: true }]);
                } else {
                  setTranscripts((ts) => {
                    const match = ts.find((t) => t.id === currentTransciptsId.current);
                    match.text = interim;
                    return [...ts];
                  });
                }
              }
            }
            let text = "";
            setTranscript((prev) => {
              text = prev + final;
              return text;
            });
            setInterimTranscript(interim);

            if (noTextTimeoutId) {
              clearTimeout(noTextTimeoutId);
            }
            if (interim.length === 0) {
              noTextTimeoutId = setTimeout(() => {
                if (text.length > 0) {
                  setTranscripts((ts) => {
                    const match = ts.find((t) => t.id === currentTransciptsId.current);
                    match.done = true;
                    return [...ts];
                  });
                  currentTransciptsId.current = null;
                  // @ts-ignore
                  messageRepo.create({
                    body: `<p>${text}</p>`,
                  }).then((message) => {
                    // @ts-ignore
                    processItem(perspective, allTopics, { id: message.id, transcript })
                      .then(() => {
                        getAllTopics(perspective, setAllTopics);
                      })
                      .catch(console.log)
                  }).catch(console.log)
                  .finally(() => {
                    setTranscript('');
                    setInterimTranscript('');
                  });;
                }
              }, secondsOfSilence * 1000);
            }
          };

          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
          };

          recognition.start();
        }

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
    const newValue = silenceTimeout + value;
    if (newValue > 0 && newValue < 11) {
      silenceTimeoutRef.current = newValue;
      setSilenceTimeout(newValue);
    }
  }

  useEffect(() => {
    transcriptionWorker.current = new TranscriptionWorker();
    transcriptionWorker.current.onmessage = async (e) => {
      const { id, text } = e.data;
      setTranscripts((ts) => {
        const match = ts.find((t) => t.id === id);
        match.text = text;
        match.done = true;
        return [...ts];
      });
      // @ts-ignore
      const message = (await messageRepo.create({
        body: `<p>${text}</p>`,
      })) as any;
      processItem(perspective, allTopics, { id: message.id, text })
        .then(() => getAllTopics(perspective, setAllTopics))
        .catch(console.log);
    };
    return () => {
      transcriptionWorker.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (transcribeAudio && !muted) startListening();
    else if (listening.current) stopListening();
  }, [transcribeAudio]);

  useEffect(() => {
    if (muted && listening.current) stopListening();
    else if (transcribeAudio) startListening();
  }, [muted]);

  useEffect(() => getAllTopics(perspective, setAllTopics), []);

  return (
    <div className={styles.wrapper}>
      <j-flex a="center" gap="400">
        <j-text nomargin>Transcribe audio</j-text>
        <j-toggle
          checked={transcribeAudio}
          onChange={() => setTranscribeAudio(!transcribeAudio)}
        >
          {transcribeAudio ? "ON" : "OFF"}
        </j-toggle>
      </j-flex>
      {transcribeAudio && (
        <j-box mt="200">
          <j-flex direction="column" gap="500">
            <j-flex a="center" gap="400" wrap>
              <j-text nomargin style={{ flexShrink: 0 }}>
                AI model
              </j-text>
              <j-menu>
                <j-menu-group collapsible title={selectedModel}>
                  {models.map((model) => (
                    <j-menu-item
                      selected={model === selectedModel}
                      onClick={() => {
                        selectedModelRef.current = model;
                        setSelectedModel(model);
                      }}
                    >
                      {model}
                    </j-menu-item>
                  ))}
                </j-menu-group>
              </j-menu>
            </j-flex>
            <j-input
              label="OpenAI key for topic parsing"
              value={openAIKey}
              placeholder="Required for topic parsing..."
              onInput={(event) => {
                const value = (event.target as HTMLInputElement).value;
                setOpenAIKey(value);
                localStorage?.setItem("openAIKey", value);
              }}
            />
            <j-flex a="center" gap="400" wrap>
              <j-text nomargin style={{ flexShrink: 0 }}>
                Volume threshold to trigger recording
              </j-text>
              <div className={styles.volumeThreshold}>
                <div id="volume" className={styles.volume} />
                <div
                  className={styles.sliderLine}
                  style={{ left: `${(+volumeThreshold / 128) * 100}%` }}
                />
                <input
                  className={styles.slider}
                  type="range"
                  min="0"
                  max="128"
                  value={volumeThreshold}
                  onChange={(e) => {
                    volumeThresholdRef.current = +e.target.value;
                    setVolumeThreshold(+e.target.value);
                  }}
                />
              </div>
            </j-flex>
            <j-flex a="center" gap="400" wrap>
              <j-text nomargin>
                Seconds of silence before recording stops
              </j-text>
              <j-flex a="center" gap="400">
                <j-button size="xs" square onClick={() => incrementTimeout(-1)}>
                  <j-icon name="caret-left-fill" />
                </j-button>
                <j-text nomargin color="color-white">
                  {silenceTimeout}
                </j-text>
                <j-button size="xs" square onClick={() => incrementTimeout(1)}>
                  <j-icon name="caret-right-fill" />
                </j-button>
              </j-flex>
            </j-flex>
            <j-flex a="center" gap="400">
              <j-text nomargin>State:</j-text>
              <j-text color="color-white" nomargin>
                {muted
                  ? "Muted"
                  : speechDetected
                    ? "Recording!"
                    : "Listening for speech..."}
              </j-text>
              {secondsOfSilence > 0 && (
                <j-text nomargin>
                  (stopping in {silenceTimeout - secondsOfSilence}s)
                </j-text>
              )}
            </j-flex>
          </j-flex>
        </j-box>
      )}
      {transcripts.length > 0 && (
        <j-box mt="600">
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
                    {/* @ts-ignore */}
                    <j-spinner size="xs" />
                    <j-text nomargin size="600" color="primary-600">
                      Transcribing audio...
                    </j-text>
                  </j-flex>
                )}
              </j-flex>
            ))}
          </j-flex>
        </j-box>
      )}
    </div>
  );
}
