"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { enrollmentError } from "@/lib/data/enrollments";

export function PaymentReceiptLink({ path }: { path: string | null }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!path) return <p className="text-sm">No screenshot attached.</p>;
  async function view() {
    setBusy(true); setError("");
    const { data, error: storageError } = await createClient().storage.from("payment-receipts").createSignedUrl(path!, 300);
    if (storageError) setError(enrollmentError(storageError));
    else setUrl(data.signedUrl);
    setBusy(false);
  }
  return <div className="space-y-2">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline" onClick={() => setUrl("")}>Open payment screenshot</a> : <Button size="sm" variant="outline" disabled={busy} onClick={() => void view()}>{busy ? "Loading…" : "View payment screenshot"}</Button>}{error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}</div>;
}
