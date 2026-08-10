"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Mail, Phone, Calendar, MessageSquare, HelpCircle } from "lucide-react";

export default function AdminSupport() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">FSP Guild Support Desk</h1>
        <p className="text-sm text-slate-500 font-medium">Get in touch with the core development team or administrative office for server assistance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support Channels */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0F4CFF]" />
                Primary Support Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-start p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <Mail className="w-5 h-5 text-[#0F4CFF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-sm text-slate-800">Email Support Helpline</span>
                  <a href="mailto:support@fsp-guild.org" className="text-xs text-blue-600 hover:underline block mt-0.5">
                    support@fsp-guild.org
                  </a>
                  <p className="text-[11px] text-slate-500 mt-1">Average response time: 2-4 business hours.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-orange-50/50 rounded-xl border border-orange-100/50">
                <MessageSquare className="w-5 h-5 text-[#FF7A00] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-sm text-slate-800">Slack Dev Guild Channels</span>
                  <span className="text-xs text-slate-600 block mt-0.5">#fsp-dashboard-help</span>
                  <p className="text-[11px] text-slate-500 mt-1">Chat directly with repository core developers.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Phone className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-sm text-slate-800">Administrative Hotline</span>
                  <span className="text-xs text-slate-700 block mt-0.5">+1 (800) 555-0199</span>
                  <p className="text-[11px] text-slate-500 mt-1">Available Mon-Fri, 9:00 AM - 5:00 PM EST.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Office Hours & Instructions */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg font-bold">Office Hours &amp; Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600 font-medium">
              <p>
                Please check the **Audit Logs** and **System Settings** panels first to verify database statuses and error codes before filing tickets.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span>Regular System Backups</span>
                  <span className="font-semibold text-emerald-600">Daily, 2:00 AM UTC</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span>Platform Maintenance Hours</span>
                  <span className="font-semibold text-amber-600">Sundays, 3:00-5:00 AM EST</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Database Mirroring Replicas</span>
                  <span className="font-semibold text-blue-600">Sync Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
