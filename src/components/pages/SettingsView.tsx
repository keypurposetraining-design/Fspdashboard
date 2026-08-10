"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Save, User, RefreshCcw } from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const SettingsView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "member");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("users")
        .update({
          name: name,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      await logMemberActivity("PROFILE_UPDATE");
      await refreshUser();
      alert("Settings profile updated successfully!");
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="neutral" size="sm">
              PREFERENCES &amp; CONTROLS
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your personal profile, role permissions, and email credentials.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl bg-white border border-slate-200 p-6 rounded-3xl">
        <CardHeader className="p-0 pb-4 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5 text-[#0F4CFF]" />
            Personal Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0F4CFF] focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Portal Role Profile (Read-only)</label>
                <input
                  type="text"
                  value={role.toUpperCase()}
                  disabled
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
              <Button type="submit" size="sm" disabled={loading} icon={<Save className="w-4 h-4" />}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
