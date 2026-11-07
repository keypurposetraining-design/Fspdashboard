"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { CertificateRow, CourseRow, PersonRow, UserRow, errorMessage } from "@/lib/legacy-rows";
import { createClient } from "@/lib/supabase/client";
import { Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function AdminCertificates() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [members, setMembers] = useState<PersonRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueMemberId, setIssueMemberId] = useState("");
  const [issueCourseId, setIssueCourseId] = useState("");
  const [certUrl, setCertUrl] = useState("");

  const [currentUser, setCurrentUser] = useState<UserRow | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [certsRes, membersRes, coursesRes] = await Promise.all([
        supabase.from("certificates").select("id, issued_at, certificate_url, members(first_name, last_name), courses(title)"),
        supabase.from("members").select("id, first_name, last_name"),
        supabase.from("courses").select("id, title")
      ]);

      if (certsRes.error) throw certsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setCertificates((certsRes.data || []) as unknown as CertificateRow[]);
      setMembers((membersRes.data || []) as unknown as PersonRow[]);
      setCourses((coursesRes.data || []) as unknown as CourseRow[]);
    } catch (err: unknown) {
      console.error("Error fetching initial certificates data:", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser((data.user) as unknown as UserRow | null);
        }
    });
    fetchInitialData();
    });
    return () => { cancelled = true; };
  }, [fetchInitialData, supabase]);

  // Handle Search
  const filteredCertificates = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = certificates.filter(c => {
      const memberName = `${c.members?.first_name || ""} ${c.members?.last_name || ""}`.toLowerCase();
      const courseTitle = (c.courses?.title || "").toLowerCase();
      return memberName.includes(q) || courseTitle.includes(q);
    });
    return filtered;
  }, [searchQuery, certificates]);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const certId = crypto.randomUUID();
      const defaultUrl = certUrl || `https://fsp.org/verify/cert-${certId}`;
      const { error } = await supabase
        .from("certificates")
        .insert({
          id: certId,
          member_id: issueMemberId,
          course_id: issueCourseId,
          issued_at: new Date().toISOString(),
          certificate_url: defaultUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "certificate issued",
        table_name: "certificates",
        record_id: certId,
        performed_by: currentUser?.id,
        details: { member_id: issueMemberId, course_id: issueCourseId }
      });

      setIsIssueModalOpen(false);
      setIssueMemberId("");
      setIssueCourseId("");
      setCertUrl("");
      await fetchInitialData();
    } catch (err: unknown) {
      alert("Error issuing certificate: " + errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (certId: string) => {
    if (!confirm("Are you sure you want to revoke this certificate?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("certificates")
        .delete()
        .eq("id", certId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "certificate revoked",
        table_name: "certificates",
        record_id: certId,
        performed_by: currentUser?.id,
        details: { certId }
      });

      await fetchInitialData();
    } catch (err: unknown) {
      alert("Error revoking certificate: " + errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">Accreditation Certificates</h1>
          <p className="text-sm text-slate-500 font-medium">Issue formal graduation certificates to members completing training levels.</p>
        </div>
        <Button size="sm" onClick={() => { setIsIssueModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Issue Certificate
        </Button>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search member name or course title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading accreditation ledger...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No certificates issued yet.</div>
          ) : (
            <Table
              columns={[
                { header: "Recipient", accessor: "member", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "N/A" },
                { header: "Accredited Course", accessor: "course", render: (row) => row.courses?.title || "N/A" },
                { header: "Issued Date", accessor: "issued_at", render: (row) => new Date(row.issued_at).toLocaleDateString() },
                { header: "Verification URL", accessor: "certificate_url", render: (row) => (
                  <a href={row.certificate_url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-navy)] hover:underline truncate max-w-xs block">
                    {row.certificate_url}
                  </a>
                ) },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <Button variant="outline" size="xs" onClick={() => handleRevoke(row.id)} className="border-rose-200 text-rose-600 hover:bg-rose-50" icon={<Trash2 className="w-3 h-3" />}>
                    Revoke
                  </Button>
                ) }
              ]}
              data={filteredCertificates}
            />
          )}
        </CardContent>
      </Card>

      {/* ISSUE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsIssueModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleIssueCertificate}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Issue Accreditation Certificate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Select Member</label>
                  <Select value={issueMemberId} onChange={e => setIssueMemberId(e.target.value)} className="w-full border rounded p-2" required>
                    <option value="">-- Choose Member --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Select accredited Course</label>
                  <Select value={issueCourseId} onChange={e => setIssueCourseId(e.target.value)} className="w-full border rounded p-2" required>
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Verification Document URL (Optional)"
                  placeholder="https://fsp.org/verify/custom-doc"
                  value={certUrl}
                  onChange={e => setCertUrl(e.target.value)}
                />
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsIssueModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Issuing..." : "Issue Certificate"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
