import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, MapPin, Mail, Calendar, Edit3, Award, Sparkles, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("members")
          .select(`
            id,
            first_name,
            last_name,
            phone,
            address,
            created_at,
            users (
              email,
              name,
              role
            )
          `)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
        }
        await logMemberActivity("PROFILE_VIEW");
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}` : (user?.name || "FSP Member");
  const email = profile?.users?.email || user?.email || "member@fsp.org";
  const phone = profile?.phone || "—";
  const address = profile?.address || "—";
  const role = profile?.users?.role || "member";
  const createdDate = profile ? new Date(profile.created_at).toLocaleDateString() : "New Member";

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <Card className="p-0 overflow-hidden border-0 shadow-lg">
        {/* Cover Graphic */}
        <div className="h-44 bg-gradient-to-r from-blue-700 via-[#0F4CFF] to-amber-500 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile Details Bar */}
        <div className="p-6 pt-0 bg-white relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-28 h-28 rounded-3xl ring-4 ring-white shadow-xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-400 font-bold text-3xl">
                {name.charAt(0)}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {name}
                  </h1>
                  <Badge variant="pro" size="sm">
                    {role === "admin" || role === "super_admin" ? "Staff" : "Member"}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {role}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mb-4">
            Professional facilitator member of the Facilitator Support Program guild.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {address}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {email}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Joined {createdDate}
            </span>
          </div>
        </div>
      </Card>

      {/* Grid: Left Stats & Skills | Right Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col (1 col) */}
        <div className="space-y-6">
          {/* Facilitation Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Facilitation Impact Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs text-slate-600 font-semibold">Phone</span>
                <span className="text-sm font-black text-slate-900">{phone}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs text-slate-600 font-semibold">Status</span>
                <span className="text-xs font-bold text-[#0F4CFF]">Active Account</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col (2 cols): Achievements & Recent Activity */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF7A00]" />
                Accreditation & Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    FSP Account Active
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified profile synced with Supabase authentication.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
