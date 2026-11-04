import React from "react";
import { Pencil } from "lucide-react";
import type { MemberProfile } from "@/lib/data/types";
import { profileCompletion } from "@/lib/profile";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Pill } from "@/components/ui/StatusBadge";
import { LinkButton } from "@/components/member/LinkButton";

export function ProfileCompletionCard({ profile }: { profile: MemberProfile | null }) {
  const c = profileCompletion(profile);
  const complete = c.percent >= 100;
  return (
    <section
      aria-labelledby="profile-completion-title"
      className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="profile-completion-title" className="text-base font-semibold text-[var(--foreground)]">
          Profile completion
        </h2>
        <Pill tone={complete ? "success" : "warning"} icon={complete ? "check" : "alert"} size="sm">
          {complete ? "Complete" : "Incomplete"}
        </Pill>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <ProgressRing value={c.percent} label="Profile completion" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {c.completed} of {c.total} required fields
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{c.hint}</p>
        </div>
      </div>
      {!complete && c.missing.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Missing fields">
          {c.missing.map((m) => (
            <li
              key={m.key}
              className="rounded-full bg-[var(--muted-light)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]"
            >
              {m.label}
            </li>
          ))}
        </ul>
      )}
      <LinkButton
        href="/profile/edit"
        variant={complete ? "outline" : "primary"}
        size="sm"
        className="mt-5 w-full"
        icon={<Pencil className="h-3.5 w-3.5" />}
      >
        {complete ? "Edit profile" : "Complete your profile"}
      </LinkButton>
    </section>
  );
}
