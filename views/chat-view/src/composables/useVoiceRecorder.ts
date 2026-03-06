import { Ad4mClient } from '@coasys/ad4m';
import { useState, useRef, useCallback } from 'preact/hooks';

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionStreamIdRef = useRef<string | null>(null);

  const handleTranscriptionText = useCallback((text: string) => {
    setPreviewText((prev) => prev + text);
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setPreviewText('');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Open transcription stream using AD4M AI service
      transcriptionStreamIdRef.current = await client.ai.openTranscriptionStream(
        'Whisper',
        handleTranscriptionText,
        { startThreshold: 0.8 }
      );
      
      // Set up media recorder to capture audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Feed audio data to transcription stream
          // Note: This is a simplified version - in reality we'd need to convert
          // the audio data to the format expected by the transcription service
          if (transcriptionStreamIdRef.current) {
            // Convert blob to array and feed to transcription
            const reader = new FileReader();
            reader.onloadend = () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              const audioData = Array.from(new Int16Array(arrayBuffer));
              client.ai.feedTranscriptionStream([transcriptionStreamIdRef.current!], audioData as any);
            };
            reader.readAsArrayBuffer(event.data);
          }
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.(error as Error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      // Close transcription stream and get final result
      if (transcriptionStreamIdRef.current) {
        await client.ai.closeTranscriptionStream(transcriptionStreamIdRef.current);
        transcriptionStreamIdRef.current = null;
      }
      
      // Send the transcript
      if (previewText.trim()) {
        onTranscript(previewText.trim());
      }
      
      setPreviewText('');
      setIsTranscribing(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsTranscribing(false);
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

  return {
    isRecording,
    isTranscribing,
    previewText,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
