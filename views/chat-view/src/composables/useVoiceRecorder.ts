import { Ad4mClient } from '@coasys/ad4m';
import { feedUtterance } from '@coasys/flux-utils';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';

interface UseVoiceRecorderOptions {
  client: Ad4mClient;
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  previewText: string;
  finalText: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
}

export function useVoiceRecorder({ client, onTranscript, onError }: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [finalText, setFinalText] = useState('');
  
  // Track text in refs for use in callbacks (avoids stale closure)
  const previewTextRef = useRef('');
  const finalTextRef = useRef('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionStreamIdRef = useRef<string | null>(null);
  const fastTranscriptionStreamIdRef = useRef<string | null>(null);

  const handleTranscriptionText = useCallback((text: string) => {
    console.log('[VoiceRecorder] FINAL transcription:', text);
    setFinalText((prev) => {
      const updated = prev + text;
      finalTextRef.current = updated;
      return updated;
    });
    previewTextRef.current = '';
    setPreviewText('');
  }, []);

  const handleTranscriptionPreview = useCallback((text: string) => {
    console.log('[VoiceRecorder] preview transcription:', text);
    previewTextRef.current = text;
    setPreviewText(text);
  }, []);

  const startRecording = async () => {
    if (isRecording || audioContextRef.current) {
      console.warn('[VoiceRecorder] already recording');
      return;
    }

    try {
      setFinalText('');
      finalTextRef.current = '';
      previewTextRef.current = '';
      setPreviewText('');

      console.log('[VoiceRecorder] requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      console.log('[VoiceRecorder] microphone granted, tracks:', stream.getAudioTracks().length);

      console.log('[VoiceRecorder] opening transcription stream (Whisper)...');
      transcriptionStreamIdRef.current = await client.ai.openTranscriptionStream(
        'Whisper',
        handleTranscriptionText,
        { startThreshold: 0.8 }
      );
      console.log('[VoiceRecorder] Whisper stream:', transcriptionStreamIdRef.current);

      console.log('[VoiceRecorder] opening transcription stream (whisper_tiny_quantized)...');
      fastTranscriptionStreamIdRef.current = await client.ai.openTranscriptionStream(
        'whisper_tiny_quantized',
        handleTranscriptionPreview,
        {
          startThreshold: 0.5,
          startWindow: 80,
          endThreshold: 0.1,
          endWindow: 50,
          timeBeforeSpeech: 20,
        }
      );
      console.log('[VoiceRecorder] fast stream:', fastTranscriptionStreamIdRef.current);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      console.log('[VoiceRecorder] loading audio worklet from /audio-processor.js ...');
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      console.log('[VoiceRecorder] audio worklet loaded, sampleRate:', audioContext.sampleRate);

      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      workletNodeRef.current = workletNode;

      // Configure VAD thresholds on the worklet to reject noise/clicks
      workletNode.port.postMessage({
        speechOnsetThreshold: 0.04,
        silenceThreshold: 0.025,
        onsetHoldFrames: 6,
        minUtteranceSamples: 2400,
      });

      workletNode.port.onmessage = async (event) => {
        if (isRecordingRef.current) {
          await feedUtterance(
            client,
            [fastTranscriptionStreamIdRef.current, transcriptionStreamIdRef.current],
            event.data
          );
        }
      };

      mediaStreamSource.connect(workletNode);
      workletNode.connect(audioContext.destination);

      setIsRecording(true);
      console.log('[VoiceRecorder] recording started');
    } catch (error) {
      console.error('[VoiceRecorder] failed to start:', error);
      onError?.(error as Error);
      await cleanup();
    }
  };

  // Ref to track recording state in worklet callback
  const isRecordingRef = useRef(false);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const cleanup = async () => {
    // Stop all tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    // Disconnect and close audio context
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    
    await audioContextRef.current?.close();
    audioContextRef.current = null;
    
    // Close transcription streams
    if (transcriptionStreamIdRef.current) {
      await client.ai.closeTranscriptionStream(transcriptionStreamIdRef.current);
      transcriptionStreamIdRef.current = null;
    }
    if (fastTranscriptionStreamIdRef.current) {
      await client.ai.closeTranscriptionStream(fastTranscriptionStreamIdRef.current);
      fastTranscriptionStreamIdRef.current = null;
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      await cleanup();
      
      // Send the final transcript (use ref to avoid stale closure)
      const finalTextValue = finalTextRef.current.trim();
      if (finalTextValue) {
        onTranscript(finalTextValue);
      }
      
      // Reset state
      setFinalText('');
      finalTextRef.current = '';
      previewTextRef.current = '';
      setPreviewText('');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError?.(error as Error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelRecording = async () => {
    if (!isRecording && !isTranscribing && !finalText && !previewText) return;
    
    try {
      setIsRecording(false);
      
      await cleanup();
      
      // Reset state without sending
      setFinalText('');
      finalTextRef.current = '';
      previewTextRef.current = '';
      setPreviewText('');
      setIsTranscribing(false);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      onError?.(error as Error);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current || audioContextRef.current) {
        cleanup().catch((err) => console.error('Cleanup error:', err));
      }
    };
  }, [client]);

  return {
    isRecording,
    isTranscribing,
    previewText,
    finalText,
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
  };
}
