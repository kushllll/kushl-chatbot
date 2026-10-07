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
        <div className="max-w-[85%] md:max-w-[70%] bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 my-4 px-4 max-w-3xl mx-auto">
      <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0 mt-0.5">
        <Image src="/pp.png" alt="Kushal Chat AI" width={28} height={28} className="object-cover" />
      </div>
      <div className="flex-1 text-zinc-200 text-sm md:text-base leading-relaxed overflow-hidden">
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-zinc-400 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
