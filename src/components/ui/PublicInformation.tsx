import Link from "next/link";
import type { ReactNode } from "react";

export default function PublicInformation({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--card-border)] border-t-4 border-t-[var(--brand-yellow)] bg-[var(--card-bg)] p-6 shadow-sm sm:p-10">
        <Link href="/about" className="text-sm font-semibold text-[var(--brand-navy)]">FSP Community</Link>
        <h1 className="mb-8 mt-4 text-3xl font-bold tracking-tight">{title}</h1>
        <div className="space-y-6 text-base leading-7 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_a]:underline">{children}</div>
        <nav aria-label="Information links" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--card-border)] pt-6 text-sm text-[var(--brand-navy)]">
          <Link href="/about">About FSP</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of service</Link><Link href="/login">Sign in</Link>
        </nav>
      </article>
    </main>
  );
}
