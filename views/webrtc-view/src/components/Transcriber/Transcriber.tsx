import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message } from "@coasys/flux-api";
import { WebRTC } from "@coasys/flux-react-web";
import { feedTranscription, startTranscription, stopTranscription, detectBrowser } from "@coasys/flux-utils";
import { useEffect, useRef, useState } from "preact/hooks";
import { v4 as uuidv4 } from "uuid";
import RecordingIcon from "../RecordingIcon/RecordingIcon";
import styles from "./Transcriber.module.scss";

type Props = { source: string; perspective: any; webRTC: WebRTC };

export default function Transcriber({ source, perspective, webRTC }: Props) {
  const { audio, transcriber } = webRTC.localState.settings;
  const { selectedModel, previewTimeout, messageTimeout } = transcriber;
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [useRemoteService, setUseRemoteService] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  // const [countDown, setCountDown] = useState(0);
  // const countDownInterval = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const sourceNode = useRef(null);
  const listening = useRef(false);
  const recognition = useRef(null);
  const timeout = useRef(null);
  const streamId = useRef(null);
  const transcriptId = useRef("");
  const browser = detectBrowser();

  const { repo: messageRepo } = useSubjects({ perspective, source, subject: Message });

  function renderVolume() {
    if (listening.current) {
      analyser.current.getByteTimeDomainData(dataArray.current);
      const maxValue = Math.max(...dataArray.current);
      const percentage = ((maxValue - 128) / 128) * 100;
      const volume = document.getElementById("volume");
      if (volume) volume.style.width = `${percentage < 3 ? 0 : percentage}%`;
      requestAnimationFrame(renderVolume);
    }
  }

  async function saveMessage() {
    // fetch latest text & mark message as saving
    let text = "";
    setTranscripts((ts) => {
      const newTranscripts = [...ts];
      const match = newTranscripts.find((t) => t.id === transcriptId.current);
      if (match) {
        text = match.text;
        match.state = "saved";
      }
      return newTranscripts;
    });
    // store id for outro transitions
    const previousId = transcriptId.current;
    transcriptId.current = null;
    // trigger outro transitions
    const transcriptCard = document.getElementById(`transcript-${previousId}`);
    if (transcriptCard) {
      transcriptCard.classList.add(styles.slideLeft);
      setTimeout(() => {
        transcriptCard.classList.add(styles.hide);
        setTimeout(() => {
          setTranscripts((ts) => ts.filter((t) => t.id !== previousId));
        }, 500);
      }, 500);
    }
    // save message
    // @ts-ignore
    await messageRepo.create({ body: `<p>${text}</p>` });
  }

  async function handleTranscriptionText(text: string) {
    // function fires every time a new chunk of text is sent back from the AI service
    setTranscripts((ts) => {
      const newTranscripts = [...ts];
      // search for existing transcript
      const match = newTranscripts.find((t) => t.id === transcriptId.current);
      // if match found, update text
      if (match) match.text = match.text + text;
      else {
        // otherwise initialise new transcript
        transcriptId.current = uuidv4();
        newTranscripts.push({ id: transcriptId.current, timestamp: new Date(), state: "transcribing", text });
      }
      return newTranscripts;
    });

    // // restart countdown interval
    // if (countDownInterval.current) {
    //   clearInterval(countDownInterval.current);
    //   countDownInterval.current = null;
    // }
    // setCountDown(messageTimeout);
    // countDownInterval.current = setInterval(
    //   () => setCountDown((t) => t - 1),
    //   1000
    // );

    // set up timeout to save transcript after messageTimeout has elapsed with no new text
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      // reset countdown interval
      // clearInterval(countDownInterval.current);
      // countDownInterval.current = null;
      saveMessage();
    }, messageTimeout * 1000);
  }

  function startRemoteTranscription() {
    const secondsOfSilence = 2;
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    let accumulatedText = "";

    recognition.current.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
          if (!transcriptId.current) {
            const id = uuidv4();
            transcriptId.current = id;
            setTranscripts((ts) => [
              ...ts,
              { id, text: accumulatedText + interim, timestamp: new Date(), done: false },
            ]);
          } else {
            setTranscripts((ts) => {
              const match = ts.find((t) => t.id === transcriptId.current);
              if (match) match.text = accumulatedText + interim;
              return [...ts];
            });
          }
        }
      }

      // accumulate final text
      if (final) {
        accumulatedText += final;
        setTranscript(accumulatedText);
      }
      setInterimTranscript(interim);

      // reset silence timeout
      if (timeout.current) clearTimeout(timeout.current);

      // start silence timeout when no interim text
      if (interim.length === 0) {
        timeout.current = setTimeout(async () => {
          if (accumulatedText.length > 0) {
            await saveMessage();
            accumulatedText = "";
            setTranscript("");
            setInterimTranscript("");
            transcriptId.current = null;
          }
        }, secondsOfSilence * 1000);
      }
    };

    recognition.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.current.start();
  }

  async function startLocalTransciption(stream: MediaStream) {
    // set up audio context & worklet node
    streamId.current = await startTranscription(handleTranscriptionText);
    await audioContext.current.audioWorklet.addModule("/audio-processor.js");
    const mediaStreamSource = audioContext.current.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext.current, "audio-processor");
    mediaStreamSource.connect(workletNode);
    workletNode.port.onmessage = (event) => {
      if (listening.current) feedTranscription(streamId.current, event.data);
    };
    workletNode.connect(audioContext.current.destination);
  }

  function startListening() {
    listening.current = true;
    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then(async (stream) => {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (useRemoteService) startRemoteTranscription();
        else startLocalTransciption(stream);
        // set up analyser to render volume
        analyser.current = audioContext.current.createAnalyser();
        sourceNode.current = audioContext.current.createMediaStreamSource(stream);
        sourceNode.current.connect(analyser.current);
        analyser.current.fftSize = 2048;
        dataArray.current = new Uint8Array(analyser.current.fftSize);
        renderVolume();
      });
  }

  function stopListening() {
    listening.current = false;
    sourceNode.current?.disconnect();
    audioContext.current?.close();
    recognition.current?.stop();
    if (streamId.current) {
      stopTranscription(streamId.current);
      streamId.current = null;
    }
  }

  useEffect(() => {
    return () => stopListening();
  }, []);

  useEffect(() => {
    if (audio) startListening();
    else stopListening();
  }, [audio]);

  useEffect(() => {
    // skip on first run by checking if audio context is present
    if (audioContext.current) {
      // restart listening with new settings
      stopListening();
      startListening();
    }
  }, [useRemoteService]);

  return (
    <div className={styles.wrapper}>
      <j-box mb="400">
        <j-flex gap="400" j="between" a="center">
          <j-text nomargin uppercase size="400" weight="800" color="primary-500">
            Transcriber
          </j-text>
          {browser === "chrome" ? (
            <j-checkbox checked={useRemoteService} onChange={() => setUseRemoteService(!useRemoteService)}>
              Use Google transcription
            </j-checkbox>
          ) : (
            <j-text>Google transcription available in Chrome</j-text>
          )}
        </j-flex>
      </j-box>
      {audio ? (
        <j-flex gap="400" a="center">
          <RecordingIcon size={30} style={{ flexShrink: 0 }} />
          <j-text nomargin style={{ flexShrink: 0, marginRight: 20 }}>
            Listening for speech...
          </j-text>
          <div className={styles.volumeThreshold}>
            <div id="volume" className={styles.volume} />
          </div>
        </j-flex>
      ) : (
        <j-flex gap="400" a="center">
          <j-icon name="mic-mute" />
          <j-text nomargin style={{ flexShrink: 0, marginRight: 20 }}>
            Audio muted
          </j-text>
        </j-flex>
      )}
      {transcripts.length > 0 && (
        <j-box mt="600">
          <j-flex direction="column" gap="400">
            {transcripts.map((transcript) => (
              <div key={transcript.id} id={`transcript-${transcript.id}`} className={styles.transcript}>
                <j-flex direction="column" gap="300">
                  <j-timestamp value={transcript.timestamp} dateStyle="short" timeStyle="short" />
                  <j-text nomargin size="600">
                    {transcript.text}
                  </j-text>
                  {transcript.state === "transcribing" && (
                    <j-flex gap="400" a="center">
                      {/* @ts-ignore */}
                      <j-spinner size="xs" />
                      <j-text nomargin size="600" color="primary-600">
                        Transcribing...
                        {/* (saving message in {countDown}{" "}
                        seconds...) */}
                      </j-text>
                    </j-flex>
                  )}
                  {transcript.state === "saved" && (
                    <j-flex gap="400" a="center">
                      <j-icon name="check-circle" color="success-600" />
                      <j-text nomargin size="600" color="success-600">
                        Saved
                      </j-text>
                    </j-flex>
                  )}
                </j-flex>
              </div>
            ))}
          </j-flex>
        </j-box>
      )}
    </div>
  );
}
