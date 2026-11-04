"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { PROFILE_FIELDS } from "@/lib/profile";
import { ROLE_LABEL } from "@/lib/status";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.firstName.trim()) e.firstName = "First name is required.";
  else if (f.firstName.trim().length > 100) e.firstName = "First name must be 100 characters or fewer.";
  if (!f.lastName.trim()) e.lastName = "Last name is required.";
  else if (f.lastName.trim().length > 100) e.lastName = "Last name must be 100 characters or fewer.";
  if (!f.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (f.password.length < 8) e.password = "Password must be at least 8 characters.";
  const phone = f.phone.trim();
  if (phone && !PROFILE_FIELDS.phone.pattern!.test(phone)) e.phone = PROFILE_FIELDS.phone.patternMessage;
  if (f.address.trim().length > 500) e.address = "Address must be 500 characters or fewer.";
  return e;
}

export default function AddMemberPage() {
  const router = useRouter();
  const toast = useToast();
  // UI hint only: /api/admin/members decides which roles the caller may assign.
  const { role: viewerRole } = useAuth();
  const roleOptions = viewerRole === "super_admin" ? ["member", "trainer", "admin"] : ["member", "trainer"];

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "member",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          address: form.address.trim(),
          role: form.role,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; memberId?: string };
      if (!res.ok || !body.memberId) {
        setServerError(body.error || "We couldn't create the member. Please try again.");
        return;
      }
      toast(`${form.firstName.trim()} ${form.lastName.trim()} was added.`);
      router.push(`/admin/members/${body.memberId}`);
    } catch {
      setServerError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add member"
        description="Create an account for a new member. They can sign in with the temporary password and change it."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Members", href: "/admin/members" },
          { label: "Add member" },
        ]}
      />

      <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
        <Section title="Account">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="First name" required value={form.firstName} onChange={set("firstName")} error={errors.firstName} maxLength={100} autoComplete="off" />
            <TextField label="Last name" required value={form.lastName} onChange={set("lastName")} error={errors.lastName} maxLength={100} autoComplete="off" />
            <TextField label="Email" type="email" required value={form.email} onChange={set("email")} error={errors.email} maxLength={255} autoComplete="off" />
            <TextField
              label="Temporary password"
              type="password"
              required
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              hint="At least 8 characters. Share it with the member securely."
              autoComplete="new-password"
            />
            <SelectField
              label="Role"
              value={form.role}
              onChange={set("role")}
              hint={viewerRole === "super_admin" ? undefined : "Only a super admin can create admin accounts."}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </SelectField>
          </div>
        </Section>

        <Section title="Contact details" description="Optional. The member can complete their profile later.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} maxLength={20} />
            <TextAreaField
              label="Address"
              className="sm:col-span-2"
              value={form.address}
              onChange={set("address")}
              error={errors.address}
              maxLength={500}
            />
          </div>
        </Section>

        {serverError && (
          <p role="alert" className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/members")} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} icon={<UserPlus className="h-4 w-4" />}>
            {submitting ? "Creating…" : "Create member"}
          </Button>
        </div>
      </form>
    </>
  );
}
