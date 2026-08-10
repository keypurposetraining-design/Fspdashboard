import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  UserCheck,
  Download,
  RefreshCw,
  CheckCircle2,
  Calendar,
  CreditCard,
  Award,
  Users,
  Video,
  BookOpen,
  FileText,
  Globe,
  ShieldCheck,
  Clock,
  Ticket,
  Mail,
  HelpCircle,
  MessageCircle,
  Share2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { logMemberActivity } from "@/lib/activity-log";

export const MembershipView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [membership, setMembership] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        // Get member record
        const { data: memberData } = await supabase
          .from("members")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          // Get membership
          const { data: memData } = await supabase
            .from("memberships")
            .select("*")
            .eq("member_id", memberData.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (memData) {
            setMembership(memData);
          }

          // Get payments history
          const { data: payData } = await supabase
            .from("payments")
            .select("*")
            .eq("member_id", memberData.id)
            .order("payment_date", { ascending: false });

          if (payData) {
            setPayments(payData);
          }
          await logMemberActivity("MEMBERSHIP_VIEW");
        }
      } catch (err) {
        console.error("Error loading membership info:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Horizontal Journey Steps for Section 2
  const horizontalJourney = [
    { title: "Registered", status: "completed" },
    { title: "Active Member", status: membership?.status === "active" ? "completed" : "upcoming" },
    { title: "Learning", status: "current" },
    { title: "Certified Facilitator", status: "upcoming" },
    { title: "Renew Membership", status: "upcoming" },
  ];

  // Membership Benefits for Section 3
  const benefitsList = [
    {
      title: "Unlimited Community Access",
      desc: "Connect 24/7 with peer facilitators in the lounge.",
      icon: <Users className="w-6 h-6 text-[#0F4CFF]" />,
    },
    {
      title: "Weekly Masterclasses",
      desc: "Live interactive workshops with world-class mentors.",
      icon: <Video className="w-6 h-6 text-[#FF7A00]" />,
    },
    {
      title: "Resource Library",
      desc: "High-resolution canvases, guides & facilitation decks.",
      icon: <BookOpen className="w-6 h-6 text-purple-600" />,
    },
    {
      title: "Training Templates",
      desc: "Ready-to-use Miro, Mural & FigJam templates.",
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: "Networking Opportunities",
      desc: "Regional meetups and peer practice breakouts.",
      icon: <Globe className="w-6 h-6 text-teal-600" />,
    },
    {
      title: "Exclusive Events",
      desc: "VIP access to Annual FSP Facilitation Summits.",
      icon: <Calendar className="w-6 h-6 text-amber-500" />,
    },
    {
      title: "Certificate Eligibility",
      desc: "Verified digital credentials for your LinkedIn.",
      icon: <Award className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Priority Support",
      desc: "Fast-track email & WhatsApp assistance desk.",
      icon: <ShieldCheck className="w-6 h-6 text-rose-500" />,
    },
  ];

  // Support Cards for Section 9
  const supportCards = [
    {
      title: "Raise Support Ticket",
      desc: "Submit a inquiry to our technical support team.",
      icon: <Ticket className="w-6 h-6 text-[#0F4CFF]" />,
      action: "Create Ticket",
    },
    {
      title: "Contact FSP Team",
      desc: "Email our facilitation member success team directly.",
      icon: <Mail className="w-6 h-6 text-[#FF7A00]" />,
      action: "Send Email",
    },
    {
      title: "WhatsApp Support",
      desc: "Instant live chat with FSP Member Desk.",
      icon: <MessageCircle className="w-6 h-6 text-emerald-600" />,
      action: "Chat Now",
    },
  ];

  // Quick Actions for Section 10
  const quickActions = [
    { label: "Renew Membership", icon: <RefreshCw className="w-5 h-5 text-[#0F4CFF]" /> },
    { label: "Download Invoice", icon: <Download className="w-5 h-5 text-[#FF7A00]" /> },
    { label: "Contact Support", icon: <Mail className="w-5 h-5 text-indigo-600" /> },
    { label: "Refer a Friend", icon: <Share2 className="w-5 h-5 text-teal-600" /> },
  ];

  const mStatus = membership?.status || "pending";
  const mStart = membership?.start_date ? new Date(membership.start_date).toLocaleDateString() : "—";
  const mEnd = membership?.end_date ? new Date(membership.end_date).toLocaleDateString() : "Lifetime";

  return (
    <div className="space-y-10 animate-in fade-in duration-200 pb-12">
      {/* PAGE TITLE & SUBTITLE */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="pro" size="sm">
              MEMBER PORTAL
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Verified Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Membership
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View your membership details, renewal status, payment history, and benefits.
          </p>
        </div>
      </div>

      {/* SECTION 1: MEMBERSHIP SUMMARY CARD */}
      <Card className="relative overflow-hidden p-6 bg-white border border-slate-200/80">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Member Main Info */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F4CFF]/10 to-blue-50/50 flex items-center justify-center text-primary font-bold text-2xl border">
                  {user?.name?.charAt(0) || "M"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {user?.name || "FSP Member"}
                    </h2>
                    <Badge variant={mStatus === "active" ? "success" : "warning"} size="sm" dot>
                      {mStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                    Account: <span className="text-[#0F4CFF]">{user?.email}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Key Grid Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Membership Tier
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  Annual Pass
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Start Date
                </span>
                <span className="font-bold text-slate-800">
                  {mStart}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Expiry Date
                </span>
                <span className="font-bold text-slate-800">
                  {mEnd}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: MEMBERSHIP JOURNEY */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Membership Journey
          </h2>
          <p className="text-xs text-slate-500">
            Track your milestone steps as an active FSP facilitator.
          </p>
        </div>

        <Card>
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
              {horizontalJourney.map((step, idx) => {
                const isCompleted = step.status === "completed";
                const isCurrent = step.status === "current";

                return (
                  <div
                    key={idx}
                    className={clsx(
                      "p-4 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center space-y-2 relative",
                      isCurrent
                        ? "bg-blue-50/60 border-blue-200 shadow-sm shadow-blue-500/5 scale-105 z-10"
                        : isCompleted
                        ? "bg-slate-50/30 border-slate-200/70"
                        : "bg-white border-dashed border-slate-200/80"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-800">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 6: PAYMENT HISTORY */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Payment Ledger History
          </h2>
          <p className="text-xs text-slate-500">
            Review your past payments records.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">No billing records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Billing Date</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.map((history, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{history.id}</td>
                        <td className="p-4 text-slate-600">{new Date(history.payment_date).toLocaleDateString()}</td>
                        <td className="p-4 text-slate-800 font-bold">${Number(history.amount).toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <Badge variant={history.status === "succeeded" ? "success" : "danger"} size="sm">
                            {history.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
