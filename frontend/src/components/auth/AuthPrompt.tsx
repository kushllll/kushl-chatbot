'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthPromptProps {
  onSignIn: () => void;
  onContinueAsGuest: () => void;
  isLoading: boolean;
}

export function AuthPrompt({
  onSignIn,
  onContinueAsGuest,
  isLoading,
}: AuthPromptProps) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-zinc-950 text-zinc-100 px-4 py-8 selection:bg-zinc-800">
      {/* Top spacer for balanced vertical alignment */}
      <div className="h-4 sm:h-8" aria-hidden="true" />

      {/* Main Choice Card */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl mb-6 relative bg-zinc-900 flex-shrink-0">
          <Image
            src="/Neon%20Orbital%20Sphere%20Emblem.png"
            alt="Kushal Chat AI"
            width={80}
            height={80}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-2">
          Kushal Chat AI
        </h1>
        <p className="text-sm sm:text-base font-medium text-zinc-400 mb-3">
          AI chat, your way.
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 mb-8 max-w-xs leading-relaxed">
          Chat immediately as a guest with temporary session memory, or sign in to save your conversations permanently across devices.
        </p>

        <div className="w-full flex flex-col gap-3">
          {/* Primary Action: Continue as Guest */}
          <button
            onClick={onContinueAsGuest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <span>Continue as Guest</span>
          </button>

          {/* Secondary Action: Sign in with Google */}
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-200 hover:text-white border border-zinc-700/80 font-medium text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="w-full text-center pt-8">
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
          <Link href="/about" className="hover:text-zinc-300 transition-colors">
            About
          </Link>
          <span className="text-zinc-700">•</span>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-zinc-700">•</span>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms
          </Link>
          <span className="text-zinc-700">•</span>
          <Link href="/contact" className="hover:text-zinc-300 transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
