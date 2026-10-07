'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff, Square } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';

interface ComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export function Composer({ onSendMessage, isLoading, onCancel }: ComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    transcript,
    error: voiceError,
  } = useVoice({
    onTranscript: (spokenText) => {
      setInput((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = input.trim();
    if (!clean || isLoading) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(clean);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {voiceError && (
        <div className="mb-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg flex items-center justify-between">
          <span>{voiceError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-2.5 shadow-lg focus-within:border-zinc-500 transition-colors"
      >
        {/* Voice Microphone Button */}
        {isVoiceSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
            aria-label="Toggle voice input"
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening ? 'Listening... speak now' : 'Message Kushal Chat AI...'
          }
          rows={1}
          className="flex-1 max-h-48 resize-none bg-transparent text-zinc-100 placeholder-zinc-500 text-sm md:text-base focus:outline-none px-1 py-1"
        />

        {/* Action Button: Send or Stop */}
        {isLoading ? (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
            title="Stop generation"
            aria-label="Stop generation"
          >
            <Square size={17} className="fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-zinc-100 text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-white transition-colors"
            title="Send message"
            aria-label="Send message"
          >
            <ArrowUp size={19} strokeWidth={2.5} />
          </button>
        )}
      </form>
      <div className="text-center mt-2">
        <span className="text-[11px] text-zinc-500">
          Kushal Chat AI may display inaccurate info. Verify important facts.
        </span>
      </div>
    </div>
  );
}
