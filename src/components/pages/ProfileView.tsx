import React from "react";
import { mockUser } from "@/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, MapPin, Mail, Calendar, Edit3, Award, Sparkles, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";

export const ProfileView: React.FC = () => {
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
              <img
                src={mockUser.avatar}
                alt={mockUser.name}
                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {mockUser.name}
                  </h1>
                  <Badge variant="pro" size="sm">
                    {mockUser.tier}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {mockUser.role}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" icon={<Edit3 className="w-4 h-4" />}>
              Edit Profile
            </Button>
          </div>

          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mb-4">
            {mockUser.bio}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {mockUser.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {mockUser.email}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Joined {mockUser.memberSince}
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
                <span className="text-xs text-slate-600 font-semibold">Hours Facilitated</span>
                <span className="text-sm font-black text-slate-900">{mockUser.stats.hoursFacilitated} hrs</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs text-slate-600 font-semibold">Community Rank</span>
                <span className="text-xs font-bold text-[#0F4CFF]">{mockUser.stats.communityRank}</span>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Expertise & Core Competencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockUser.skills.map((skill, idx) => (
                  <Badge key={idx} variant="primary" size="md">
                    {skill}
                  </Badge>
                ))}
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
                Recent Milestones & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Earned Advanced Executive Facilitation Certification
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified by FSP Guild Board on June 14, 2026.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-blue-100 text-[#0F4CFF] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Top Community Contributor Award Q2 2026
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recognized for authoring 5 top-rated workshop energizer guides.
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
