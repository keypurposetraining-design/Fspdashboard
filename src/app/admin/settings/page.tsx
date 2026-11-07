"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserRow, errorMessage } from "@/lib/legacy-rows";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Cpu, Settings, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function AdminSettings() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<UserRow | null>(null);
  const [adminProfile, setAdminProfile] = useState<UserRow | null>(null);

  // Form profile edits
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAdminUser((user) as unknown as UserRow | null);
          setEmail(user.email || "");
          
          const { data: profile } = await supabase
            .from("users")
            .select("name, role")
            .eq("id", user.id)
            .single();

          if (profile) {
            setAdminProfile((profile) as unknown as UserRow | null);
            setName(profile.name || "");
          }
        }
      } catch (err: unknown) {
        console.error("Error loading admin settings profile:", errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadAdminProfile();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;

    try {
      setLoading(true);
      setMessage("");

      // Update public.users
      const { error: profileErr } = await supabase
        .from("users")
        .update({
          name,
          updated_at: new Date().toISOString()
        })
        .eq("id", adminUser.id);

      if (profileErr) throw profileErr;

      // Update auth meta name
      await supabase.auth.updateUser({
        data: { name }
      });

      await supabase.from("audit_logs").insert({
        action: "admin profile updated",
        table_name: "users",
        record_id: adminUser.id,
        performed_by: adminUser.id,
        details: { name }
      });

      setMessage("Admin profile updated successfully!");
    } catch (err: unknown) {
      alert("Error updating profile: " + errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div>
        <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 font-medium">Configure administrator preferences, customize platform credentials, and check system environment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar settings */}
        <div className="space-y-2">
          <Button variant="soft" className="w-full justify-start" icon={<Settings size={16} />}>Admin Profile</Button>
        </div>

        {/* Configurations Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Admin Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Admin Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !adminUser ? (
                <div className="py-4 text-slate-500 text-sm">Loading admin credentials...</div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <Input
                    label="Administrator Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address (Login)"
                    value={email}
                    disabled
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Security Role Type</span>
                    <span className="text-sm font-semibold text-slate-700 mt-1 block">
                      <Badge variant="pro">{adminProfile?.role || "Admin"}</Badge>
                    </span>
                  </div>

                  {message && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {message}
                    </div>
                  )}

                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile Details"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Secure Environment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Supabase Client Endpoint</span>
                  <span className="text-slate-700 font-mono text-xs break-all mt-1 block">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL || "strepofhoforwpvulkdp.supabase.co"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Platform Server Stack</span>
                  <span className="text-slate-700 mt-1 block">Next.js 16.3 + React 19 + Supabase</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                <Shield className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium">
                  <strong>Service Credentials:</strong> Secret tokens like the Supabase Service Role Key are securely hidden and only invoked directly on backend servers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
