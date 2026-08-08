import React from "react";
import { mockUser, mockLearningLevels, mockPaymentHistory } from "@/data/mockData";
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
  AlertTriangle,
  Clock,
  Ticket,
  Mail,
  HelpCircle,
  MessageCircle,
  Share2,
  Lock,
  ArrowRight,
  Sparkles,
  Flame,
} from "lucide-react";
import { clsx } from "clsx";

export const MembershipView: React.FC = () => {
  // Horizontal Journey Steps for Section 2
  const horizontalJourney = [
    { title: "Registered", status: "completed" },
    { title: "Active Member", status: "completed" },
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
      title: "Membership FAQ",
      desc: "Find quick answers to common billing & course questions.",
      icon: <HelpCircle className="w-6 h-6 text-purple-600" />,
      action: "View FAQs",
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
    { label: "Download Membership Card", icon: <UserCheck className="w-5 h-5 text-emerald-600" /> },
    { label: "View Payment History", icon: <CreditCard className="w-5 h-5 text-purple-600" /> },
    { label: "Contact Support", icon: <Mail className="w-5 h-5 text-indigo-600" /> },
    { label: "Refer a Friend", icon: <Share2 className="w-5 h-5 text-teal-600" /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-200 pb-12">
      {/* ---------------------------------------------------- */}
      {/* PAGE TITLE & SUBTITLE                                */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="pro" size="sm">
              MEMBER PORTAL
            </Badge>
            <span className="text-xs text-slate-500 font-medium">ID: {mockUser.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Membership
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View your membership details, renewal status, payment history, and membership benefits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
            Download Card
          </Button>
          <Button variant="secondary" size="md" icon={<RefreshCw className="w-4 h-4" />}>
            Renew Membership
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: MEMBERSHIP SUMMARY CARD (LARGE PREMIUM)    */}
      {/* ---------------------------------------------------- */}
      <Card gradientBorder className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 p-2">
          {/* Member Main Info */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <img
                  src={mockUser.avatar}
                  alt={mockUser.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {mockUser.name}
                    </h2>
                    <Badge variant="success" size="sm" dot>
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                    Member ID: <span className="text-[#0F4CFF]">{mockUser.id}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Key Grid Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Membership Plan
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {mockUser.tier}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Start Date
                </span>
                <span className="font-bold text-slate-800">
                  {mockUser.startDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Expiry Date
                </span>
                <span className="font-bold text-slate-800">
                  {mockUser.expiryDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Remaining Days
                </span>
                <span className="font-extrabold text-[#0F4CFF] text-sm">
                  {mockUser.remainingDays} Days
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="md"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Renew Membership
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-4 h-4" />}
              >
                Download Membership Card
              </Button>
            </div>
          </div>

          {/* Progress Ring showing Membership Validity */}
          <div className="w-full lg:w-56 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50/80 to-slate-50 border border-blue-100 rounded-3xl shrink-0 text-center space-y-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#0F4CFF] stroke-current"
                  strokeWidth="3.5"
                  strokeDasharray="98, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">360</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Days Left</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700">
              Validity: 98% Remaining
            </span>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: MEMBERSHIP JOURNEY (HORIZONTAL JOURNEY)  */}
      {/* ---------------------------------------------------- */}
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
                        ? "bg-gradient-to-b from-orange-50 to-white border-orange-300 shadow-md ring-2 ring-orange-400/20"
                        : isCompleted
                        ? "bg-blue-50/50 border-blue-200 text-slate-800"
                        : "bg-slate-50/60 border-slate-200/60 opacity-60"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                        isCompleted
                          ? "bg-[#0F4CFF] text-white"
                          : isCurrent
                          ? "bg-[#FF7A00] text-white animate-pulse"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <Flame className="w-5 h-5 text-white" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <h4
                      className={clsx(
                        "text-xs sm:text-sm font-bold tracking-tight",
                        isCurrent ? "text-[#FF7A00]" : "text-slate-900"
                      )}
                    >
                      {step.title}
                    </h4>

                    {isCurrent && (
                      <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-[#FF7A00] px-2 py-0.5 rounded-full">
                        CURRENT STAGE
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-blue-600">
                        Completed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: MEMBERSHIP BENEFITS                        */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Membership Benefits
          </h2>
          <p className="text-xs text-slate-500">
            Exclusive features and perks included in your Annual Membership plan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefitsList.map((benefit, idx) => (
            <Card key={idx} hoverEffect className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 w-fit border border-slate-100">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {benefit.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
                <span>Included in Plan</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: PAYMENT SUMMARY (4 CARDS)                  */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Payment Summary
          </h2>
          <p className="text-xs text-slate-500">
            Overview of your current membership billing details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Membership Fee */}
          <Card hoverEffect className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Membership Fee
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">₹3,000</span>
              <Badge variant="success" size="sm">
                Paid
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">Annual Tier Subscription</p>
          </Card>

          {/* Card 2: Renewal Amount */}
          <Card hoverEffect className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Renewal Amount
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">₹3,000</span>
              <span className="text-xs font-bold text-[#0F4CFF]">31 July 2027</span>
            </div>
            <p className="text-[11px] text-slate-500">Next Scheduled Renewal</p>
          </Card>

          {/* Card 3: Last Payment */}
          <Card hoverEffect className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Last Payment
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">₹3,000</span>
              <span className="text-xs font-medium text-slate-600">01 Aug 2026</span>
            </div>
            <p className="text-[11px] text-slate-500">Transaction ID: FSP-2026-0891</p>
          </Card>

          {/* Card 4: Payment Status */}
          <Card hoverEffect className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Payment Status
            </span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xl font-black text-emerald-600">Verified</span>
              <Badge variant="success" size="md" dot>
                Paid
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">All invoices settled</p>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: LEARNING LEVELS (TABLE)                    */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Learning Levels
          </h2>
          <p className="text-xs text-slate-500">
            Facilitation levels breakdown, course fees, and unlock statuses.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                    <th className="p-4">Level</th>
                    <th className="p-4">Level Title</th>
                    <th className="p-4">Fee</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mockLearningLevels.map((lvl, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-extrabold text-[#0F4CFF] text-sm">
                        {lvl.level}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {lvl.title}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {lvl.fee}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            lvl.status === "Paid"
                              ? "success"
                              : lvl.status === "Pending"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                          dot={lvl.status === "Pending"}
                        >
                          {lvl.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {lvl.action === "Completed" ? (
                          <Button variant="soft" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}>
                            Completed
                          </Button>
                        ) : lvl.action === "Pay Now" ? (
                          <Button variant="primary" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />}>
                            Pay Now
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled icon={<Lock className="w-3.5 h-3.5" />}>
                            Unavailable
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: PAYMENT HISTORY (TABLE)                   */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Payment History
          </h2>
          <p className="text-xs text-slate-500">
            Download sample tax invoices and review past payment records.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mockPaymentHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-600 font-semibold">{item.date}</td>
                      <td className="p-4 font-bold text-slate-900">{item.description}</td>
                      <td className="p-4 font-extrabold text-slate-900">{item.amount}</td>
                      <td className="p-4">
                        <Badge variant="success" size="sm" dot>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: RENEWAL REMINDER (ATTENTION CARD)          */}
      {/* ---------------------------------------------------- */}
      <Card gradientBorder className="bg-gradient-to-r from-orange-500 via-[#FF7A00] to-amber-600 text-white border-0 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Renewal Attention Notice
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Your membership expires in 360 Days
            </h3>
            <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
              Renew before expiry to continue accessing courses, events, and community benefits without interruption.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="bg-white text-[#FF7A00] hover:bg-orange-50 font-black shadow-lg whitespace-nowrap shrink-0"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Renew Now
          </Button>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 8: MEMBERSHIP BENEFITS PROGRESS               */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Membership Benefits Progress
          </h2>
          <p className="text-xs text-slate-500">
            Real-time tracking of your benefit utilization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card hoverEffect className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Courses Accessed</span>
            <h4 className="text-2xl font-black text-slate-900">
              6 <span className="text-xs font-semibold text-slate-400">of 18</span>
            </h4>
            <ProgressBar value={33} color="primary" showValue={false} />
          </Card>

          <Card hoverEffect className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Resources Downloaded</span>
            <h4 className="text-2xl font-black text-slate-900">
              {mockUser.stats.resourcesDownloaded}
            </h4>
            <span className="text-[11px] font-bold text-emerald-600">✓ Unlimited Access</span>
          </Card>

          <Card hoverEffect className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Events Attended</span>
            <h4 className="text-2xl font-black text-slate-900">
              {mockUser.stats.eventsAttended}
            </h4>
            <span className="text-[11px] font-bold text-blue-600">12 Live Workshops</span>
          </Card>

          <Card hoverEffect className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Certificates Earned</span>
            <h4 className="text-2xl font-black text-slate-900">
              {mockUser.stats.certificatesEarned}
            </h4>
            <span className="text-[11px] font-bold text-purple-600">Verified Credentials</span>
          </Card>

          <Card hoverEffect className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Community Participation</span>
            <h4 className="text-2xl font-black text-slate-900">
              {mockUser.stats.communityParticipation}%
            </h4>
            <ProgressBar value={85} color="secondary" showValue={false} />
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 9: SUPPORT                                   */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Support & Help Desk
          </h2>
          <p className="text-xs text-slate-500">
            Need help with your membership or billing? Our team is here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {supportCards.map((sc, idx) => (
            <Card key={idx} hoverEffect className="flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-slate-50 w-fit border border-slate-100">
                  {sc.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {sc.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" fullWidth icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  {sc.action}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 10: QUICK ACTIONS (ICON CARDS)                */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Quick Actions
          </h2>
          <p className="text-xs text-slate-500">
            Fast shortcuts to membership management operations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2.5 group cursor-pointer"
            >
              <div className="p-3.5 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
                {qa.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F4CFF] transition-colors leading-tight">
                {qa.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
