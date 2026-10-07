'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoice({
  onTranscript,
}: {
  onTranscript?: (text: string) => void;
} = {}): VoiceState {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const instance = new SpeechRecognition();
      instance.continuous = false;
      instance.interimResults = false;
      instance.lang = 'en-US';

      instance.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      instance.onresult = (event: any) => {
        const result = event.results[0]?.[0]?.transcript || '';
        setTranscript(result);
        if (onTranscript && result) {
          onTranscript(result);
        }
      };

      instance.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please check permissions.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      instance.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = instance;
    }
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch {
      // If already started, stop then start
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
