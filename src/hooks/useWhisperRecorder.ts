import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseWhisperRecorderOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in milliseconds
}

interface UseWhisperRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  recordingDuration: number;
}

export const useWhisperRecorder = ({
  onTranscript,
  onError,
  maxDuration = 60000, // 60 seconds default
}: UseWhisperRecorderOptions): UseWhisperRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!isMountedRef.current) return;
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      if (!isMountedRef.current) return;
      
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (!isMountedRef.current) return;

      if (error) {
        throw new Error(error.message || 'Transcription failed');
      }

      if (data?.transcript) {
        onTranscript(data.transcript);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      if (isMountedRef.current) {
        onError?.(err instanceof Error ? err.message : 'Failed to transcribe audio');
      }
    } finally {
      if (isMountedRef.current) {
        setIsTranscribing(false);
      }
    }
  }, [onTranscript, onError]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      onError?.('Audio recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearTimers();
        stream.getTracks().forEach(track => track.stop());
        
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { 
            type: mediaRecorder.mimeType 
          });
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorder.onerror = () => {
        clearTimers();
        setIsRecording(false);
        onError?.('Recording error occurred');
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Update duration every 100ms
      durationRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - startTimeRef.current);
      }, 100);

      // Auto-stop at max duration
      timerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, maxDuration);

    } catch (err) {
      console.error('Error starting recording:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [isSupported, maxDuration, onError, transcribeAudio, clearTimers]);

  const stopRecording = useCallback(() => {
    clearTimers();
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setRecordingDuration(0);
  }, [clearTimers]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (!isTranscribing) {
      startRecording();
    }
  }, [isRecording, isTranscribing, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
    recordingDuration,
  };
};
