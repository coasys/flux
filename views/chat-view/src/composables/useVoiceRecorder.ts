import { Ad4mClient } from '@coasys/ad4m';
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
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  toggleRecording: () => Promise<void>;
}

export function useVoiceRecorder({ client, onTranscript, onError }: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [previewText, setPreviewText] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionStreamIdRef = useRef<string | null>(null);
  const fastTranscriptionStreamIdRef = useRef<string | null>(null);

  const handleTranscriptionText = useCallback((text: string) => {
    setPreviewText((prev) => prev + text);
  }, []);

  const handleTranscriptionPreview = useCallback((text: string) => {
    // Live preview during transcription
    setPreviewText((prev) => {
      // Append preview text (will be replaced by final)
      const base = prev.split('...')[0];
      return base + text + '...';
    });
  }, []);

  const startRecording = async () => {
    // Guard: prevent multiple concurrent recordings
    if (isRecording || audioContextRef.current) {
      console.warn('Recording already in progress');
      return;
    }

    try {
      setPreviewText('');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      streamRef.current = stream;
      
      // Open transcription streams (final + preview)
      transcriptionStreamIdRef.current = await client.ai.openTranscriptionStream(
        'Whisper',
        handleTranscriptionText,
        { startThreshold: 0.8 }
      );
      
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
      
      // Set up AudioContext and Worklet for raw PCM capture
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Load the audio worklet processor
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      workletNodeRef.current = workletNode;
      
      // Handle audio data from worklet
      workletNode.port.onmessage = (event) => {
        if (isRecordingRef.current) {
          const audioData = Array.from(event.data);
          // Feed to both transcription streams
          client.ai.feedTranscriptionStream(
            [fastTranscriptionStreamIdRef.current!, transcriptionStreamIdRef.current!], 
            audioData as any
          );
        }
      };
      
      mediaStreamSource.connect(workletNode);
      workletNode.connect(audioContext.destination);
      
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
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
      
      // Send the transcript
      const finalText = previewText.replace(/\.\.\.$/, '').trim();
      if (finalText) {
        onTranscript(finalText);
      }
      
      setPreviewText('');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError?.(error as Error);
    } finally {
      setIsTranscribing(false);
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
        cleanup();
      }
    };
  }, []);

  return {
    isRecording,
    isTranscribing,
    previewText,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
