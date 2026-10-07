'use client';

import React from 'react';
import { Message } from '@/types';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end my-3 px-4">
        <div className="max-w-[85%] md:max-w-[70%] bg-zinc-800 text-zinc-100 border border-zinc-700/60 px-4 py-2.5 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const hasContent = Boolean(message.content && message.content.length > 0);

  return (
    <div className="flex gap-3 my-4 px-4 max-w-3xl mx-auto">
      <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 flex-shrink-0 mt-0.5 shadow-sm bg-zinc-900">
        <Image
          src="/Neon%20Orbital%20Sphere%20Emblem.png"
          alt="Kushal Chat AI"
          width={32}
          height={32}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 text-zinc-100 text-sm md:text-base leading-relaxed shadow-sm">
        {isStreaming && !hasContent ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words font-normal">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-zinc-300 animate-pulse rounded-sm align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
