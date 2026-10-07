import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | Kushal Chat AI',
  description: 'Terms of Service for Kushal Chat AI — access rules, acceptable use, and AI disclaimers.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-400">
            Last updated: October 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Kushal Chat AI (&quot;the Service&quot;), whether as an unauthenticated guest or as an authenticated user, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              2. Description of Service
            </h2>
            <p className="mb-3">
              Kushal Chat AI provides an interface enabling real-time conversational interactions with advanced artificial intelligence models. The Service offers two usage modalities:
            </p>
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="font-semibold text-zinc-200">Guest Mode:</span> Instant, registration-free access with ephemeral in-memory session processing. Conversations are not persisted to database storage.
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="font-semibold text-zinc-200">Authenticated Mode:</span> Google OAuth login providing persistent conversation management and cross-device sync powered by PostgreSQL.
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              3. Acceptable Use Policy
            </h2>
            <p className="mb-2">
              You agree to use the Service in compliance with all applicable laws and regulations. You shall not:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>
                Attempt to disrupt, overload, probe, or compromise the integrity and performance of the Service.
              </li>
              <li>
                Bypass or circumvent rate limits, authentication controls, or operational restrictions.
              </li>
              <li>
                Use automated bots, scrapers, or scripts to flood or abuse API endpoints.
              </li>
              <li>
                Generate or transmit unlawful, infringing, sexually explicit, abusive, or harmful content.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              4. AI Output Disclaimer & Accuracy
            </h2>
            <p className="mb-2">
              Artificial intelligence language models generate responses probabilistically. As such:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
              <li>
                Responses may contain inaccuracies, omissions, factual errors, or outdated information.
              </li>
              <li>
                The Service is not intended for and must not be relied upon as legal, medical, financial, or critical engineering advice. Always verify information independently with qualified human experts.
              </li>
              <li>
                Generated outputs do not reflect the official opinions, endorsements, or positions of Kushal Chat AI or its operators.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              5. Service Availability & Rate Limits
            </h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. We reserve the right to establish rate limits (such as per-minute IP sliding windows), restrict access, or modify model availability at any time to preserve operational stability and service availability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              6. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Kushal Chat AI and its contributors shall not be held liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to access the Service, including any reliance on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              7. Changes to Terms
            </h2>
            <p>
              We may revise these Terms of Service periodically. Updated versions will be published directly to this page with an updated revision date. Continued use of the Service following revisions constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              8. Contact & Questions
            </h2>
            <p>
              If you have inquiries regarding these Terms of Service, please visit our{' '}
              <Link href="/contact" className="text-zinc-100 underline hover:text-white">
                Contact page
              </Link>{' '}
              or reach out via our{' '}
              <a
                href="https://github.com/kushllll/kushl-chatbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-100 underline hover:text-white"
              >
                GitHub repository
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
