'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onSelectSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  'Help me design a clean software architecture',
  'Explain how async event loops work in Python',
  'Review my REST API design best practices',
  'Brainstorm technical approaches for my project',
];

export function ChatArea({
  messages,
  isStreaming,
  onSelectSuggestion,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-700 shadow-md mb-4 relative">
          <Image src="/Neon%20Orbital%20Sphere%20Emblem.png" alt="Kushal Chat AI" width={56} height={56} className="object-cover w-full h-full" priority />
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-zinc-100 mb-2">
          What can I help with today?
        </h2>
        <p className="text-sm text-zinc-400 mb-8 max-w-sm">
          Ask questions, brainstorm ideas, analyze code, or dictate your message via voice.
        </p>

        {onSelectSuggestion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSelectSuggestion(s)}
                className="text-left p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-xs md:text-sm text-zinc-300 hover:text-zinc-100 transition-colors flex items-center justify-between group"
              >
                <span>{s}</span>
                <Sparkles size={14} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id || index}
          message={msg}
          isStreaming={isStreaming && index === messages.length - 1 && msg.role === 'assistant'}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
