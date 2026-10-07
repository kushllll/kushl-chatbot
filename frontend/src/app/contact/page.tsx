import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Contact | Kushal Chat AI',
  description: 'Contact and support information for Kushal Chat AI — issue reporting and inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Contact & Support
          </h1>
          <p className="text-sm text-zinc-400">
            Have questions, feedback, or need technical assistance with Kushal Chat AI?
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Primary Channel: GitHub Repository */}
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-zinc-100 text-base">
                  GitHub Repository & Issue Tracker
                </h2>
                <p className="text-xs text-zinc-400">
                  Official channel for bug reports, questions, and feature requests
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              Support and technical communications are managed through the project&apos;s GitHub repository. To report an issue, suggest improvements, or ask questions about the project, please open an issue or discussion on GitHub.
            </p>

            <a
              href="https://github.com/kushllll/kushl-chatbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors"
            >
              <span>Visit GitHub Repository</span>
              <span className="text-zinc-400">→</span>
            </a>
          </div>

          {/* Common Questions */}
          <section className="pt-2">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Common Questions
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <h3 className="font-medium text-zinc-200 mb-1 text-xs sm:text-sm">
                  How can I delete my saved chats?
                </h3>
                <p className="text-xs text-zinc-400">
                  You can delete any conversation immediately using the trash icon in the sidebar while signed in. Deletion removes the conversation record and all its messages from the database.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
                <h3 className="font-medium text-zinc-200 mb-1 text-xs sm:text-sm">
                  Can I use Kushal Chat AI without creating an account?
                </h3>
                <p className="text-xs text-zinc-400">
                  Yes. Choose &quot;Continue as Guest&quot; on the home screen to chat without signing in. Guest sessions operate with in-memory streaming and are not saved to the database.
                </p>
              </div>
            </div>
          </section>

          {/* Back to chat CTA */}
          <div className="pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-colors"
            >
              <MessageSquare size={14} />
              <span>Return to Chat</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
