import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kushal Chat AI',
  description: 'Privacy Policy for Kushal Chat AI — data handling, guest mode isolation, and security practices.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-400">
            Last updated: October 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              1. Overview & Scope
            </h2>
            <p>
              This Privacy Policy describes how Kushal Chat AI (&quot;the Application&quot;) handles information across both guest chat and authenticated modes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              2. Data Handling by Access Mode
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-semibold text-zinc-200 mb-1">
                  Guest Mode (Unauthenticated)
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
                  <li>
                    <strong className="text-zinc-300">No Database Storage:</strong> Guest conversations are processed ephemerally in-memory for the duration of the stream and are not written to our PostgreSQL database.
                  </li>
                  <li>
                    <strong className="text-zinc-300">No Account Information:</strong> No name, email, password, or persistent user profile is requested or collected.
                  </li>
                  <li>
                    <strong className="text-zinc-300">In-Memory Rate Limiting:</strong> Client IP addresses are tracked temporarily in server memory using a sliding-window counter solely to prevent automated flooding and denial-of-service abuse (20 requests per minute per IP).
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="font-semibold text-zinc-200 mb-1">
                  Authenticated Mode (Google Sign-In)
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
                  <li>
                    <strong className="text-zinc-300">Account Profile:</strong> When signing in with Google via Neon Auth, the Application receives your account identifier, name, email address, and profile image URL.
                  </li>
                  <li>
                    <strong className="text-zinc-300">Database Storage:</strong> Conversations and chat messages created while signed in are stored in our managed Neon PostgreSQL database to support persistent history across sessions.
                  </li>
                  <li>
                    <strong className="text-zinc-300">Session Authentication:</strong> Neon Auth manages session state using standard HTTP cookies and cryptographic authentication tokens.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              3. AI Inference & Third-Party Service (OpenRouter)
            </h2>
            <p className="mb-2">
              To generate AI responses, the Application transmits user prompts and relevant chat history over HTTPS to OpenRouter (<span className="text-zinc-400">openrouter.ai</span>).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>
                The Application uses OpenRouter as an inference routing API to connect to available open-weight models.
              </li>
              <li>
                The Application itself does not operate machine learning model training pipelines or train models on user conversations.
              </li>
              <li>
                Data transmitted to OpenRouter is processed in accordance with OpenRouter&apos;s privacy policy and the policies of upstream model providers. Users should consult OpenRouter&apos;s published documentation for provider-level terms and data handling practices.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              4. Cookies & Analytics
            </h2>
            <p>
              The Application does not include third-party marketing trackers, advertising networks, or commercial analytics scripts. Cookies are strictly limited to necessary authentication session tokens managed through Neon Auth.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              5. Data Deletion
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>
                <strong className="text-zinc-300">Authenticated History:</strong> Signed-in users can delete individual conversations using the delete icon in the sidebar. Deleting a conversation triggers a database deletion request that removes the conversation and its associated messages.
              </li>
              <li>
                <strong className="text-zinc-300">Guest Chats:</strong> Guest conversations are held in local browser state and are cleared when the browser tab is closed or guest mode is exited.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              6. Security
            </h2>
            <p>
              Communications between the browser, frontend hosting (Netlify), backend API (Render), and database (Neon PostgreSQL) are transmitted using Transport Layer Security (HTTPS/TLS).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              7. Contact & Inquiries
            </h2>
            <p>
              For technical inquiries, issue reports, or privacy questions regarding the Application, please submit an issue via the{' '}
              <a
                href="https://github.com/kushllll/kushl-chatbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-100 underline hover:text-white"
              >
                GitHub repository
              </a>{' '}
              or visit the{' '}
              <Link href="/contact" className="text-zinc-100 underline hover:text-white">
                Contact page
              </Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
