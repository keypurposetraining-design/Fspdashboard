import React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/profile";

/** Profile photo, or the member's initials when there is none. */
export function MemberAvatar({
  src,
  name,
  size = 64,
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      // Avatars come from the Supabase public bucket; next/image would need remote config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name}'s profile photo` : "Profile photo"}
        style={style}
        className={cn("shrink-0 rounded-full border border-[var(--card-border)] object-cover", className)}
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: Math.round(size / 2.8) }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] font-bold text-white",
        className
      )}
      aria-label={name ? `${name}'s initials` : "No profile photo"}
      role="img"
    >
      {initials(name)}
    </span>
  );
}
