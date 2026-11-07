"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { logMemberActivity } from "@/lib/activity-log";
import { toDataError } from "@/lib/data/errors";
import { ResourceRow } from "@/lib/legacy-rows";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText, RefreshCcw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export const ResourcesView: React.FC = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceRow[]>([]);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true); setLoadError(null);
      const { data, error } = await supabase
        .from("resources")
        .select("*, courses(title)");

      if (error) throw error;
      setResources((data || []) as unknown as ResourceRow[]);

      await logMemberActivity("RESOURCE_VIEW");
    } catch (err: unknown) {
      setLoadError(toDataError(err, "resources").message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      fetchResources();
    });
    return () => { cancelled = true; };
  }, [fetchResources]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              RESOURCE LIBRARY
            </Badge>
          </div>
          <h1 className="fsp-dot text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Reference Files &amp; Tools
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Download handbooks, framework PDFs, and reference toolkits to support your facilitation coursework.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResources} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {loadError && <div role="alert" className="mb-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-4 text-sm font-medium">{loadError}</div>}
      {loading ? (
        <div className="py-12 text-center text-[var(--muted)] font-medium">Loading library documents...</div>
      ) : resources.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)] border border-dashed rounded-3xl bg-[var(--card-bg)]">
          No training guides or PDFs available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <Card key={res.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-[var(--brand-navy-light)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--brand-gold)] to-[var(--brand-gold-hover)] text-white flex items-center justify-center shrink-0 shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" size="sm">
                    {res.courses?.title || "Syllabus File"}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)] leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed mt-2">
                    {res.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-[var(--card-border)] mt-4">
                <Button variant="primary" size="sm" fullWidth onClick={() => {
                  logMemberActivity("RESOURCE_DOWNLOAD", { resource_id: res.id });
                  window.open(res.url, "_blank", "noopener,noreferrer");
                }} icon={<Download className="w-4 h-4" />}>
                  Download File
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
