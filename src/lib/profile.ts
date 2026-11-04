// Profile completion and validation, shared by the dashboard, profile pages
// and the edit form. The database enforces the same length limits
// (members_profile_lengths in 004_member_workflow.sql).

import type { EditableProfileFields, MemberProfile } from "@/lib/data/types";

type FieldKey = keyof EditableProfileFields;

interface FieldRule {
  label: string;
  section: "personal" | "address" | "professional";
  required: boolean;
  max: number;
  pattern?: RegExp;
  patternMessage?: string;
}

export const PROFILE_FIELDS: Record<FieldKey, FieldRule> = {
  first_name: { label: "First name", section: "personal", required: true, max: 100 },
  last_name: { label: "Last name", section: "personal", required: true, max: 100 },
  phone: {
    label: "Phone",
    section: "personal",
    required: true,
    max: 20,
    pattern: /^\+?[0-9 ()-]{7,20}$/,
    patternMessage: "Enter a valid phone number (digits, spaces, +, - and brackets).",
  },
  avatar_url: { label: "Profile photo", section: "personal", required: true, max: 500 },
  address: { label: "Address", section: "address", required: true, max: 500 },
  city: { label: "City", section: "address", required: true, max: 100 },
  state: { label: "State", section: "address", required: true, max: 100 },
  postal_code: {
    label: "Postal code",
    section: "address",
    required: true,
    max: 12,
    pattern: /^[A-Za-z0-9 -]{3,12}$/,
    patternMessage: "Enter a valid postal code.",
  },
  country: { label: "Country", section: "address", required: true, max: 100 },
  occupation: { label: "Occupation", section: "professional", required: true, max: 150 },
  organization: { label: "Company / workplace", section: "professional", required: false, max: 150 },
};

export const SECTION_LABEL = {
  personal: "personal information",
  address: "address",
  professional: "professional information",
} as const;

export interface ProfileCompletion {
  percent: number;
  completed: number;
  total: number;
  missing: { key: FieldKey; label: string; section: FieldRule["section"] }[];
  /** A short, human hint such as "Complete your address information." */
  hint: string;
}

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/** Completion is computed from the required fields actually present on the profile. */
export function profileCompletion(profile: Partial<MemberProfile> | null | undefined): ProfileCompletion {
  const required = (Object.keys(PROFILE_FIELDS) as FieldKey[]).filter((k) => PROFILE_FIELDS[k].required);
  const missing = required
    .filter((k) => !filled(profile?.[k]))
    .map((k) => ({ key: k, label: PROFILE_FIELDS[k].label, section: PROFILE_FIELDS[k].section }));
  const completed = required.length - missing.length;
  const percent = Math.round((completed / required.length) * 100);

  let hint = "Your profile is complete.";
  if (missing.length > 0) {
    const sections = Array.from(new Set(missing.map((m) => m.section)));
    hint =
      sections.length === 1
        ? `Complete your ${SECTION_LABEL[sections[0]]}.`
        : `Add your ${missing
            .slice(0, 2)
            .map((m) => m.label.toLowerCase())
            .join(" and ")}${missing.length > 2 ? ` and ${missing.length - 2} more` : ""}.`;
  }
  return { percent, completed, total: required.length, missing, hint };
}

export type ProfileErrors = Partial<Record<FieldKey, string>>;

/** Trims values, drops unknown keys and validates. Returns cleaned values or errors. */
export function validateProfile(input: Partial<Record<FieldKey, string | null>>): {
  values: Partial<EditableProfileFields>;
  errors: ProfileErrors;
} {
  const values: Partial<EditableProfileFields> = {};
  const errors: ProfileErrors = {};

  (Object.keys(PROFILE_FIELDS) as FieldKey[]).forEach((key) => {
    if (!(key in input)) return;
    const rule = PROFILE_FIELDS[key];
    const raw = input[key];
    const v = typeof raw === "string" ? raw.trim() : "";

    if (key === "first_name" || key === "last_name") {
      if (!v) errors[key] = `${rule.label} is required.`;
    }
    if (v.length > rule.max) errors[key] = `${rule.label} must be ${rule.max} characters or fewer.`;
    else if (v && rule.pattern && !rule.pattern.test(v)) errors[key] = rule.patternMessage;

    values[key] = v === "" ? null : v;
  });

  return { values, errors };
}

export function fullName(p: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  return [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
