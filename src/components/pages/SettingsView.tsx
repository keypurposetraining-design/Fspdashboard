import React, { useState } from "react";
import { mockUser } from "@/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, Bell, Shield, CreditCard, Palette, Save, Upload } from "lucide-react";
import { clsx } from "clsx";

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "security" | "appearance">("account");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [communityDigest, setCommunityDigest] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="neutral" size="sm">
              PREFERENCES & CONTROLS
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your personal profile, notification triggers, security, and interface preferences.
          </p>
        </div>

        <Button variant="primary" size="md" icon={<Save className="w-4 h-4" />}>
          Save All Changes
        </Button>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("account")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === "account"
              ? "bg-[#0F4CFF] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <User className="w-4 h-4" />
          Account Profile
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === "notifications"
              ? "bg-[#0F4CFF] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === "security"
              ? "bg-[#0F4CFF] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === "appearance"
              ? "bg-[#0F4CFF] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Palette className="w-4 h-4" />
          Appearance
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "account" && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Personal Profile Information</CardTitle>
          </CardHeader>

          {/* Avatar Dropzone UI */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Profile Photo</h4>
              <p className="text-xs text-slate-500 mb-2">PNG, JPG or WEBP (Max 2MB)</p>
              <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
                Upload New Photo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                defaultValue={mockUser.name}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0F4CFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                defaultValue={mockUser.email}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0F4CFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Professional Title</label>
              <input
                type="text"
                defaultValue={mockUser.role}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0F4CFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Location</label>
              <input
                type="text"
                defaultValue={mockUser.location}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0F4CFF] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700">Bio & Practice Focus</label>
              <textarea
                rows={3}
                defaultValue={mockUser.bio}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#0F4CFF] focus:outline-none resize-none"
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === "notifications" && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Email Notifications</h4>
                <p className="text-xs text-slate-500">Receive announcements and task grading updates via email.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-5 h-5 accent-[#0F4CFF] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Event Reminders</h4>
                <p className="text-xs text-slate-500">Get reminders 2 hours before live masterclasses start.</p>
              </div>
              <input
                type="checkbox"
                checked={eventReminders}
                onChange={(e) => setEventReminders(e.target.checked)}
                className="w-5 h-5 accent-[#0F4CFF] rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === "security" && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Password & Two-Factor Security</CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs max-w-md">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl" />
            </div>
            <Button variant="primary" size="sm">Update Password</Button>
          </div>
        </Card>
      )}

      {activeTab === "appearance" && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Theme & Interface Options</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border-2 border-[#0F4CFF] bg-blue-50/20 cursor-pointer">
              <h4 className="text-sm font-bold text-slate-900">Light Theme (Default)</h4>
              <p className="text-xs text-slate-500">Royal blue accents on clean slate & white background.</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed">
              <h4 className="text-sm font-bold text-slate-900">Dark Mode (Upcoming)</h4>
              <p className="text-xs text-slate-500">High contrast dark theme for low-light environments.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
