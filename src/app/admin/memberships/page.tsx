"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Search, Check, Ban, Calendar, X, RefreshCcw } from "lucide-react";

export default function AdminMemberships() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<any>("pending");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchMemberships();
  }, []);

  async function fetchMemberships() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          id,
          member_id,
          start_date,
          end_date,
          status,
          created_at,
          members (
            first_name,
            last_name,
            users (
              email
            )
          )
        `);

      if (error) throw error;
      setMemberships(data || []);
      setFilteredMemberships(data || []);
    } catch (err: any) {
      console.error("Error fetching memberships:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search & Filter
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = memberships.filter(m => {
      const memberName = `${m.members?.first_name || ""} ${m.members?.last_name || ""}`.toLowerCase();
      const email = m.members?.users?.email?.toLowerCase() || "";
      const matchesSearch = memberName.includes(q) || email.includes(q);
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredMemberships(filtered);
  }, [searchQuery, statusFilter, memberships]);

  const handleApprove = async (membershipId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("memberships")
        .update({
          status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", membershipId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "membership approved",
        table_name: "memberships",
        record_id: membershipId,
        performed_by: currentUser?.id,
        details: { status: "active" }
      });

      await fetchMemberships();
    } catch (err: any) {
      alert("Error approving membership: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdate = (membership: any) => {
    setSelectedMembership(membership);
    setStartDate(membership.start_date || "");
    setEndDate(membership.end_date || "");
    setMembershipStatus(membership.status);
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembership) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("memberships")
        .update({
          start_date: startDate,
          end_date: endDate || null,
          status: membershipStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedMembership.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "membership updated",
        table_name: "memberships",
        record_id: selectedMembership.id,
        performed_by: currentUser?.id,
        details: {
          start_date: startDate,
          end_date: endDate,
          status: membershipStatus
        }
      });

      setIsUpdateModalOpen(false);
      await fetchMemberships();
    } catch (err: any) {
      alert("Error updating membership: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Memberships</h1>
        <p className="text-sm text-slate-500 font-medium">Verify pending memberships, renew, cancel, or modify member tier dates.</p>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search member name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40 border rounded px-2">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMemberships} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading memberships...</div>
          ) : filteredMemberships.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No memberships found.</div>
          ) : (
            <Table
              columns={[
                { header: "Member", accessor: "member", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "N/A" },
                { header: "Email", accessor: "email", render: (row) => row.members?.users?.email || "N/A" },
                { header: "Start Date", accessor: "start_date" },
                { header: "End Date", accessor: "end_date", render: (row) => row.end_date || "Lifetime" },
                { header: "Status", accessor: "status", render: (row) => (
                  <Badge variant={row.status === "active" ? "success" : row.status === "pending" ? "warning" : "danger"}>
                    {row.status}
                  </Badge>
                ) },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <div className="flex gap-2">
                    {row.status === "pending" && (
                      <Button variant="outline" size="xs" onClick={() => handleApprove(row.id)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" icon={<Check className="w-3 h-3" />}>
                        Approve
                      </Button>
                    )}
                    <Button variant="outline" size="xs" onClick={() => handleOpenUpdate(row)} icon={<Calendar className="w-3 h-3" />}>
                      Update
                    </Button>
                  </div>
                ) }
              ]}
              data={filteredMemberships}
            />
          )}
        </CardContent>
      </Card>

      {/* UPDATE MODAL */}
      {isUpdateModalOpen && selectedMembership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsUpdateModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSaveUpdate}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Update Membership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Member</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedMembership.members ? `${selectedMembership.members.first_name || ""} ${selectedMembership.members.last_name || ""}` : "N/A"}
                  </span>
                </div>
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 font-semibold block">Membership Status</label>
                  <Select value={membershipStatus} onChange={e => setMembershipStatus(e.target.value)} className="w-full border rounded p-2">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </Select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
