"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Search, Edit, Eye, UserPlus, X, RefreshCcw } from "lucide-react";

export default function AdminMembers() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Edit fields
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("members")
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone,
          address,
          created_at,
          users (
            email,
            role
          ),
          memberships (
            status,
            end_date
          )
        `);

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (err: any) {
      console.error("Error fetching members:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = members.filter(m => {
      const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      const email = m.users?.email?.toLowerCase() || "";
      const phone = m.phone || "";
      return fullName.includes(q) || email.includes(q) || phone.includes(q);
    });
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const handleOpenView = (member: any) => {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  };

  const handleOpenEdit = (member: any) => {
    setSelectedMember(member);
    setEditFirstName(member.first_name || "");
    setEditLastName(member.last_name || "");
    setEditPhone(member.phone || "");
    setEditAddress(member.address || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("members")
        .update({
          first_name: editFirstName,
          last_name: editLastName,
          phone: editPhone,
          address: editAddress,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedMember.id);

      if (error) throw error;

      // Write Audit Log
      await supabase.from("audit_logs").insert({
        action: "member updated",
        table_name: "members",
        record_id: selectedMember.id,
        performed_by: currentUser?.id,
        details: {
          first_name: editFirstName,
          last_name: editLastName,
          phone: editPhone,
          address: editAddress
        }
      });

      setIsEditModalOpen(false);
      await fetchMembers();
    } catch (err: any) {
      alert("Error saving member details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Members Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Manage member registration information, accounts, and details.</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchMembers} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading FSP directory...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No members found matching your search.</div>
          ) : (
            <Table
              columns={[
                { header: "Name", accessor: "name", render: (row) => `${row.first_name || ""} ${row.last_name || ""}` },
                { header: "Email", accessor: "email", render: (row) => row.users?.email || "N/A" },
                { header: "Phone", accessor: "phone", render: (row) => row.phone || "—" },
                { header: "Join Date", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleDateString() },
                { header: "Membership Status", accessor: "membership", render: (row) => {
                  const mStatus = row.memberships?.[0]?.status || "none";
                  return (
                    <Badge variant={mStatus === "active" ? "success" : mStatus === "pending" ? "warning" : "danger"}>
                      {mStatus}
                    </Badge>
                  );
                } },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => router.push(`/admin/members/${row.id}`)} icon={<Eye className="w-3 h-3" />}>
                      View
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => handleOpenEdit(row)} icon={<Edit className="w-3 h-3" />}>
                      Edit
                    </Button>
                  </div>
                ) }
              ]}
              data={filteredMembers}
            />
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsViewModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <CardHeader className="p-0 pb-4 border-b">
              <CardTitle className="text-xl font-bold">Member Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">First Name</span>
                  <span className="text-sm font-medium text-slate-900">{selectedMember.first_name || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Last Name</span>
                  <span className="text-sm font-medium text-slate-900">{selectedMember.last_name || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-medium text-slate-900">{selectedMember.users?.email || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Phone Number</span>
                  <span className="text-sm font-medium text-slate-900">{selectedMember.phone || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Address</span>
                  <span className="text-sm font-medium text-slate-900">{selectedMember.address || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Role</span>
                  <span className="text-sm font-medium text-slate-900">
                    <Badge variant="neutral">{selectedMember.users?.role || "member"}</Badge>
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Join Date</span>
                  <span className="text-sm font-medium text-slate-900">{new Date(selectedMember.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsEditModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSaveEdit}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Edit Member Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="First Name"
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <textarea
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
