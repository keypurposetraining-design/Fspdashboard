"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, UserX } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/data/member";
import { toDataError } from "@/lib/data/errors";
import type { EditableProfileFields, MemberProfile } from "@/lib/data/types";
import { PROFILE_FIELDS, fullName, validateProfile, type ProfileErrors } from "@/lib/profile";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { TextAreaField, TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LinkButton } from "@/components/member/LinkButton";
import { MemberAvatar } from "@/components/member/MemberAvatar";

// Only these fields are ever sent; role, member number and membership are never part of the form.
type FormKey = Exclude<keyof EditableProfileFields, "avatar_url">;
type FormValues = Record<FormKey, string>;

const FORM_KEYS: FormKey[] = [
  "first_name",
  "last_name",
  "phone",
  "address",
  "city",
  "state",
  "postal_code",
  "country",
  "occupation",
  "organization",
];

export default function EditProfilePage() {
  const { user, role } = useAuth();
  const { data: profile, error, loading, reload } = useAsync(getMyProfile, [user?.id], Boolean(user));
  const profilePath = role === "admin" || role === "super_admin" ? "/admin/account/profile" : "/profile";

  const header = (
    <PageHeader
      title="Edit profile"
      description="Keep your personal, address and professional details up to date."
      breadcrumbs={[{ label: "Profile", href: profilePath }, { label: "Edit" }]}
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
          description="Your member profile is created when you first sign in. Try again in a moment."
          action={{ label: "Try again", onClick: reload }}
        />
      </>
    );

  return (
    <>
      {header}
      <EditProfileForm key={profile.id} profile={profile} profilePath={profilePath} />
    </>
  );
}

function EditProfileForm({ profile, profilePath }: { profile: MemberProfile; profilePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const { refreshUser } = useAuth();

  const [values, setValues] = useState<FormValues>(
    () => Object.fromEntries(FORM_KEYS.map((k) => [k, profile[k] ?? ""])) as FormValues
  );
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const field = (key: FormKey) => ({
    label: PROFILE_FIELDS[key].label,
    value: values[key],
    error: errors[key],
    maxLength: PROFILE_FIELDS[key].max,
    required: PROFILE_FIELDS[key].required,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setValues((s) => ({ ...s, [key]: v }));
      if (errors[key]) setErrors((s) => ({ ...s, [key]: undefined }));
    },
  });

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("The photo must be 2 MB or smaller.");
      return;
    }
    setPhotoError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    const { errors: found } = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const input: Partial<Record<keyof EditableProfileFields, string | null>> = { ...values };
      if (photo) input.avatar_url = await uploadAvatar(photo);
      await updateMyProfile(input);
      toast("Profile updated");
      await refreshUser();
      router.push(profilePath);
    } catch (err) {
      const de = toDataError(err, "EditProfileForm.save");
      setFormError(de.message);
      toast(de.message, "error");
      setSaving(false);
    }
  };

  const name = fullName({ first_name: values.first_name, last_name: values.last_name });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <p role="alert" className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-light)] px-4 py-3 text-sm text-red-800">
          {formError}
        </p>
      )}

      <Section title="Personal information">
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <MemberAvatar src={preview ?? profile.avatar_url} name={name} size={80} />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose a profile photo"
              onChange={onPickPhoto}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              icon={<Camera className="h-4 w-4" aria-hidden="true" />}
            >
              {profile.avatar_url || preview ? "Change photo" : "Upload photo"}
            </Button>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              {photo ? `Selected: ${photo.name} — saved when you click Save Changes.` : "JPG, PNG or WebP, up to 2 MB."}
            </p>
            {photoError && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {photoError}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField {...field("first_name")} autoComplete="given-name" />
          <TextField {...field("last_name")} autoComplete="family-name" />
          <TextField {...field("phone")} type="tel" autoComplete="tel" hint="Include your country code, e.g. +91 98765 43210" />
        </div>
      </Section>

      <Section title="Address">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextAreaField {...field("address")} autoComplete="street-address" className="sm:col-span-2" rows={3} />
          <TextField {...field("city")} autoComplete="address-level2" />
          <TextField {...field("state")} autoComplete="address-level1" />
          <TextField {...field("postal_code")} autoComplete="postal-code" />
          <TextField {...field("country")} autoComplete="country-name" />
        </div>
      </Section>

      <Section title="Professional information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField {...field("occupation")} autoComplete="organization-title" />
          <TextField {...field("organization")} autoComplete="organization" />
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <LinkButton href={profilePath} variant="outline">
          Cancel
        </LinkButton>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
