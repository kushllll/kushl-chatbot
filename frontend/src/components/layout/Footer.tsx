import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <p>© 2026 Kushal Chat AI. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-zinc-300 transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-zinc-300 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
