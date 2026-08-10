"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Download, ExternalLink, FileText, RefreshCcw } from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const ResourcesView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    fetchResources();
  }, [user]);

  async function fetchResources() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("resources")
        .select("*, courses(title)");

      if (error) throw error;
      setResources(data || []);

      await logMemberActivity("RESOURCE_VIEW");
    } catch (err: any) {
      console.error("Error loading resources:", err.message);
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
            <Badge variant="primary" size="sm">
              RESOURCE LIBRARY
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Reference Files &amp; Tools
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Download handbooks, framework PDFs, and reference toolkits to support your facilitation coursework.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResources} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">Loading library documents...</div>
      ) : resources.length === 0 ? (
        <div className="py-12 text-center text-slate-500 border border-dashed rounded-3xl bg-white">
          No training guides or PDFs available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <Card key={res.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" size="sm">
                    {res.courses?.title || "Syllabus File"}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">
                    {res.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                <Button variant="primary" size="sm" fullWidth onClick={() => {
                  logMemberActivity("RESOURCE_DOWNLOAD", { resource_id: res.id });
                  window.open(res.file_url, "_blank");
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
