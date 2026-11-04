"use client";

import React from "react";
import { Pencil, UserX } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { getMyProfile } from "@/lib/data/member";
import { fullName } from "@/lib/profile";
import { ROLE_LABEL } from "@/lib/status";
import { DescriptionList, PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { Pill } from "@/components/ui/StatusBadge";
import { LinkButton } from "@/components/member/LinkButton";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { ProfileCompletionCard } from "@/components/member/ProfileCompletionCard";

export default function ProfilePage() {
  const { user, role } = useAuth();
  const { data: profile, error, loading, reload } = useAsync(getMyProfile, [user?.id], Boolean(user));
  const manager = role === "admin" || role === "super_admin";
  const profilePath = manager ? "/admin/account/profile" : "/profile";

  const header = (
    <PageHeader
      title="Profile"
      description="Manage your personal information"
      actions={
        profile ? (
          <LinkButton href={`${profilePath}/edit`} icon={<Pencil className="h-4 w-4" />}>
            Edit Profile
          </LinkButton>
        ) : undefined
      }
    />
  );

  if (loading && profile === undefined) return <>{header}<LoadingState variant="detail" label="Loading your profile" /></>;
  if (error)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load your profile" onRetry={reload} />
      </>
    );
  if (!profile)
    return (
      <>
        {header}
        <EmptyPanel
          icon={<UserX className="h-6 w-6" />}
          title="Your profile isn't ready yet"
          description="Your member profile is created when you first sign in. Try again in a moment, or contact the FSP team if this continues."
          action={{ label: "Try again", onClick: reload }}
        />
      </>
    );

  const name = fullName(profile) || user?.name || "";

  return (
    <>
      {header}
      <div className={manager ? "max-w-3xl" : "grid grid-cols-1 gap-6 lg:grid-cols-3"}>
        <div className={manager ? "space-y-6" : "space-y-6 lg:col-span-2"}>
          <section className="flex flex-col items-start gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-xs sm:flex-row sm:items-center">
            <MemberAvatar src={profile.avatar_url} name={name} size={80} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-[var(--foreground)]">{name || "Name not provided"}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill tone="info" icon="check" size="sm">
                  {ROLE_LABEL[role ?? "member"] ?? "Member"}
                </Pill>
                {!manager && <span className="font-mono text-sm text-[var(--muted)]">
                  {profile.member_number ?? "Member ID not assigned"}
                </span>}
              </div>
            </div>
          </section>

          <Section title="Personal information">
            <DescriptionList
              items={[
                { label: "Full name", value: fullName(profile) },
                { label: "Email", value: user?.email },
                { label: "Phone", value: profile.phone },
              ]}
            />
          </Section>

          <Section title="Address">
            <DescriptionList
              items={[
                { label: "Address", value: profile.address },
                { label: "City", value: profile.city },
                { label: "State", value: profile.state },
                { label: "Postal code", value: profile.postal_code },
                { label: "Country", value: profile.country },
              ]}
            />
          </Section>

          <Section title="Professional information">
            <DescriptionList
              items={[
                { label: "Occupation", value: profile.occupation },
                { label: "Company / workplace", value: profile.organization },
              ]}
            />
          </Section>
        </div>

        {!manager && <div className="lg:self-start">
          <ProfileCompletionCard profile={profile} />
        </div>}
      </div>
    </>
  );
}
