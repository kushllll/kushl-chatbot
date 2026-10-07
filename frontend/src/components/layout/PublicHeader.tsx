import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function PublicHeader() {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700/80 relative flex-shrink-0">
            <Image
              src="/Neon%20Orbital%20Sphere%20Emblem.png"
              alt="Kushal Chat AI"
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-semibold text-sm text-zinc-200 group-hover:text-white transition-colors">
            Kushal Chat AI
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-900"
        >
          <ArrowLeft size={14} />
          <span>Back to Chat</span>
        </Link>
      </div>
    </header>
  );
}
