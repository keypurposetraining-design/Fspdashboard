"use client";

import React, { useState } from "react";
import { ScrollText } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { SelectField, TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/components/ui/Timeline";
import { useAsync } from "@/lib/useAsync";
import { listSettings, updateSetting, type SettingRow } from "@/lib/data/superAdmin";
import { toDataError } from "@/lib/data/errors";
import { SETTING_LABEL } from "@/components/super-admin/auditLabels";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
const EDITABLE_KEYS = new Set(["membership_term_months", "renewal_fee"]);
const MAX_FEE = 1_000_000;

export default function SystemSettingsPage() {
  const { data, error, loading, reload } = useAsync(listSettings, []);

  const header = (
    <PageHeader
      title="System Settings"
      description="Values used across the membership workflow."
      breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "System Settings" }]}
    />
  );

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingState variant="detail" label="Loading settings" />
      </>
    );
  }
  if (error && !data) {
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={reload} />
      </>
    );
  }
  const settings = data ?? [];
  const byKey = new Map(settings.map((s) => [s.key, s]));
  const others = settings.filter((s) => !EDITABLE_KEYS.has(s.key));

  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Keyed on updated_at so the form re-initialises after a save/reload. */}
        <TermCard key={`term-${byKey.get("membership_term_months")?.updated_at ?? "none"}`} row={byKey.get("membership_term_months")} onSaved={reload} />
        <FeeCard key={`fee-${byKey.get("renewal_fee")?.updated_at ?? "none"}`} row={byKey.get("renewal_fee")} onSaved={reload} />
      </div>

      <Section title="Other settings" description="Read-only. These keys are managed outside this page.">
        {others.length === 0 ? (
          <EmptyPanel compact title="No other settings" description="Only the settings above are configured." />
        ) : (
          <dl className="divide-y divide-[var(--card-border)]">
            {others.map((s) => (
              <div key={s.key} className="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-3 sm:gap-4">
                <dt>
                  <p className="font-mono text-sm font-medium text-[var(--foreground)]">{s.key}</p>
                  <p className="text-xs text-[var(--muted)]">Updated {formatDate(s.updated_at, true)}</p>
                </dt>
                <dd className="sm:col-span-2">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--muted-light)] p-3 font-mono text-xs text-[var(--foreground)]">
                    {JSON.stringify(s.value, null, 2)}
                  </pre>
                </dd>
              </div>
            ))}
          </dl>
        )}
        <AuditNote />
      </Section>
    </div>
  );
}

function AuditNote() {
  return (
    <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
      <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
      Changes are recorded in the audit log (Settings changed).
    </p>
  );
}

function LastUpdated({ row }: { row?: SettingRow }) {
  return (
    <p className="text-xs text-[var(--muted)]">
      {row ? `Last updated ${formatDate(row.updated_at, true)}` : "Not set yet — saving will create this setting."}
    </p>
  );
}

function useSave(key: string, onSaved: () => void) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const save = async (value: Record<string, unknown>) => {
    setSaving(true);
    setFormError(null);
    try {
      await updateSetting(key, value);
      toast(`${SETTING_LABEL[key] ?? key} saved.`);
      onSaved();
    } catch (e) {
      setFormError(toDataError(e, `save ${key}`).message);
    } finally {
      setSaving(false);
    }
  };
  return { saving, formError, save };
}

function TermCard({ row, onSaved }: { row?: SettingRow; onSaved: () => void }) {
  const initial = row?.value?.months;
  const [months, setMonths] = useState(typeof initial === "number" ? String(initial) : "");
  const [error, setError] = useState<string | undefined>();
  const { saving, formError, save } = useSave("membership_term_months", onSaved);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(months);
    if (!months.trim() || !Number.isInteger(n) || n < 1 || n > 60) {
      setError("Enter a whole number of months between 1 and 60.");
      return;
    }
    setError(undefined);
    void save({ months: n });
  };

  const unchanged = typeof initial === "number" && Number(months) === initial;

  return (
    <Section title="Membership" description="How long a membership lasts once an application is approved.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField
          label="Membership term (months)"
          type="number"
          inputMode="numeric"
          min={1}
          max={60}
          step={1}
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          error={error}
          hint="Between 1 and 60. Applies to memberships approved after saving."
          required
        />
        {formError && (
          <p role="alert" className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LastUpdated row={row} />
          <Button type="submit" disabled={saving || unchanged}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
      <AuditNote />
    </Section>
  );
}

function FeeCard({ row, onSaved }: { row?: SettingRow; onSaved: () => void }) {
  const initialAmount = row?.value?.amount;
  const initialCurrency = typeof row?.value?.currency === "string" ? (row.value.currency as string) : "INR";
  const [amount, setAmount] = useState(
    typeof initialAmount === "number" || typeof initialAmount === "string" ? String(initialAmount) : ""
  );
  const [currency, setCurrency] = useState(initialCurrency);
  const [error, setError] = useState<string | undefined>();
  const { saving, formError, save } = useSave("renewal_fee", onSaved);

  // Keep an unexpected stored currency selectable instead of silently replacing it.
  const currencyOptions: string[] = (CURRENCIES as readonly string[]).includes(initialCurrency)
    ? [...CURRENCIES]
    : [initialCurrency, ...CURRENCIES];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0 || n > MAX_FEE) {
      setError(`Enter an amount greater than 0 and up to ${MAX_FEE.toLocaleString("en-IN")}.`);
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("Use at most two decimal places.");
      return;
    }
    if (!(CURRENCIES as readonly string[]).includes(currency)) {
      setError("Choose a supported currency.");
      return;
    }
    setError(undefined);
    void save({ amount: n, currency });
  };

  const unchanged = Number(amount) === Number(initialAmount) && currency === initialCurrency && row !== undefined;

  return (
    <Section title="Fees" description="The renewal fee members are asked to pay.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            className="sm:col-span-2"
            label="Renewal fee amount"
            type="number"
            inputMode="decimal"
            min={0.01}
            max={MAX_FEE}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={error}
            hint={`Greater than 0, up to ${MAX_FEE.toLocaleString("en-IN")}.`}
            required
          />
          <SelectField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        </div>
        {formError && (
          <p role="alert" className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LastUpdated row={row} />
          <Button type="submit" disabled={saving || unchanged}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
      <p className="mt-4 text-xs text-[var(--muted)]">Admins can also edit the renewal fee.</p>
      <AuditNote />
    </Section>
  );
}
