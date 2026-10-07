import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About | Kushal Chat AI',
  description: 'Learn about Kushal Chat AI — fast, privacy-respecting, and responsive AI chat.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl mb-4 relative bg-zinc-900 flex-shrink-0">
            <Image
              src="/Neon%20Orbital%20Sphere%20Emblem.png"
              alt="Kushal Chat AI"
              width={80}
              height={80}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Kushal Chat AI
          </h1>
          <p className="text-base text-zinc-400 max-w-md">
            Fast, intelligent, and responsive AI chat designed for clarity and control.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          {/* Mission */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">
              The Mission
            </h2>
            <p className="mb-3">
              Kushal Chat AI was created with a clear objective: provide a streamlined, responsive conversational AI assistant that respects your time and your data. Many modern AI chat interfaces are bogged down by heavy paywalls, mandatory account barriers, intrusive analytics, and complex settings.
            </p>
            <p>
              We prioritize rapid response times, clean aesthetics, progressive streaming, and direct user choice above all else.
            </p>
          </section>

          {/* Dual-Mode Philosophy */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">
              Dual-Mode Philosophy
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-semibold text-zinc-100 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Instant Guest Access
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Start conversing immediately with zero friction. No sign-up, no email verification, and no database persistence. Sessions remain in your browser with ephemeral in-memory processing.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-semibold text-zinc-100 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Authenticated Account
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sign in with Google via Neon Auth when you want permanent multi-device sync, conversation history organization, and seamless thread management stored safely in PostgreSQL.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Architecture */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">
              Architecture & Stack
            </h2>
            <p className="mb-4">
              The platform is built on modern, lightweight, production-grade cloud primitives:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                <div className="font-semibold text-zinc-200">Frontend</div>
                <div className="text-zinc-400 mt-0.5">Next.js App Router, React, Tailwind CSS, Lucide icons, Netlify Edge</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                <div className="font-semibold text-zinc-200">Backend API</div>
                <div className="text-zinc-400 mt-0.5">FastAPI (Python), asynchronous SSE streaming, Render Web Service</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                <div className="font-semibold text-zinc-200">Authentication</div>
                <div className="text-zinc-400 mt-0.5">Neon Auth (Managed Better Auth) with Google OAuth 2.0</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                <div className="font-semibold text-zinc-200">Database</div>
                <div className="text-zinc-400 mt-0.5">Neon Serverless PostgreSQL with connection pooling</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 sm:col-span-2">
                <div className="font-semibold text-zinc-200">AI Inference</div>
                <div className="text-zinc-400 mt-0.5">OpenRouter API routing to vetted open-weight LLMs with low-latency streaming</div>
              </div>
            </div>
          </section>

          {/* Open Source / Community */}
          <section className="pt-2">
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              Source Code & Feedback
            </h2>
            <p className="mb-4">
              Kushal Chat AI is developed openly. For bug reports, feature suggestions, or technical questions, please visit our repository:
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/kushllll/kushl-chatbot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 text-xs font-medium transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Repository</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-colors"
              >
                Launch Chat
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
