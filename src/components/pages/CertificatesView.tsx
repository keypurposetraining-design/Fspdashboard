"use client";

import React, { useState, useEffect } from "react";
import { toDataError } from "@/lib/data/errors";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Award, Trophy, Download, Share2, ShieldCheck, RefreshCcw } from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const CertificatesView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [member, setMember] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  async function fetchInitialData() {
    if (!user) return;
    try {
      setLoading(true); setLoadError(null);
      // Fetch member
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (memberData) {
        setMember(memberData);

        // Fetch certificates
        const { data: certsData, error: certsErr } = await supabase
          .from("certificates")
          .select("*, courses(title)")
          .eq("member_id", memberData.id);
        if (certsErr) throw certsErr;
        setCertificates(certsData || []);

        await logMemberActivity("CERTIFICATE_VIEW");
      }
    } catch (err: any) {
      setLoadError(toDataError(err, "certificates").message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" size="sm" dot>
              ACCREDITED &amp; VERIFIED
            </Badge>
          </div>
          <h1 className="fsp-dot text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Certificates &amp; Accreditations
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Your verified credentials, digital badges, and official FSP facilitator accreditations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {loadError && <div role="alert" className="mb-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-4 text-sm font-medium">{loadError}</div>}
      {loading ? (
        <div className="py-12 text-center text-[var(--muted)] font-medium">Loading credentials...</div>
      ) : certificates.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)] border border-dashed rounded-3xl bg-[var(--card-bg)]">
          No accreditations or graduation certificates issued yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-[var(--brand-navy-light)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--brand-navy)] to-[var(--brand-navy-hover)] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                  <Badge variant="pro" size="sm">
                    VERIFIED ACCREDITATION
                  </Badge>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[var(--brand-gold-ink)] uppercase tracking-wider block mb-1">
                    FACILITATION ACCREDITATION
                  </span>
                  <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                    {cert.courses?.title || "Accredited Level Graduate"}
                  </h3>
                  <p className="text-xs text-[var(--muted)] font-mono mt-1">
                    Credential ID: <strong className="text-[var(--foreground)]">{cert.id}</strong>
                  </p>
                </div>

                {/* Issue Date & Verification */}
                <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium pt-3 border-t border-[var(--card-border)]">
                  <span>Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                  <span className="text-[var(--success)] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Publicly Verifiable
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="primary" size="sm" fullWidth onClick={() => {
                    logMemberActivity("CERTIFICATE_DOWNLOAD", { certificate_id: cert.id });
                    window.open(cert.certificate_url, "_blank");
                  }} icon={<Download className="w-3.5 h-3.5" />}>
                    View Verification Link
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
