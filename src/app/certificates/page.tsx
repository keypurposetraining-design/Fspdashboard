// src/app/certificates/page.tsx
import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Download,
  Verified as Certificate,
  CheckSquare,
  Lock,
  ArrowRight,
  Link as Linkedin,
  Globe as Facebook,
  MessageSquare,
  Mail,
  ClipboardCopy,
  Calendar,
  HelpCircle,
  Award,
} from "lucide-react";
import {
  mockCertificates,
  mockAchievementBadges,
  mockLearningLevels,
} from "@/data/mockData";

export const metadata: Metadata = {
  title: "Certificates & Achievements | FSP Member Hub",
  description: "Celebrate your learning journey and showcase your accomplishments.",
};

export default function CertificatesPage() {
  const certificatesEarned = mockCertificates.length;
  const badgesEarned = mockAchievementBadges.filter((b) => b.unlocked).length;
  const learningHours = 125;
  const completionRate = "92%";

  return (
    <div className="space-y-10 py-8 px-4 md:px-8 lg:px-12">
      {/* PAGE HEADER */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-primary">Certificates &amp; Achievements</h1>
        <p className="mt-2 text-lg text-slate-600">
          Celebrate your learning journey and showcase your accomplishments.
        </p>
      </section>

      {/* SECTION 1 – ACHIEVEMENT SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Certificates Earned" value={certificatesEarned} color="blue" />
        <StatCard title="Badges Earned" value={badgesEarned} color="orange" />
        <StatCard title="Learning Hours" value={learningHours} color="green" />
        <StatCard title="Completion Rate" value={completionRate} color="purple" />
      </section>

      {/* SECTION 2 – LATEST CERTIFICATE */}
      <section>
        <Card gradientBorder className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader className="flex flex-col items-start space-y-2">
            <CardTitle className="text-2xl text-primary">Latest Certificate</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="border rounded-lg overflow-hidden shadow-md">
              <div className="bg-slate-200 h-48 flex items-center justify-center text-slate-500">
                Certificate Preview
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">FSP Level 1 Certification</p>
              <p className="text-sm text-slate-600">Issued On: 10 Aug 2026</p>
              <p className="text-sm text-slate-600">Certificate ID: FSP-L1-000145</p>
              <p className="text-sm text-slate-600">Issued By: Facilitator Support Program</p>
              <div className="flex flex-col space-y-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="#" className="flex items-center"><Certificate className="mr-1" size={16} />View Certificate</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#" className="flex items-center"><Download className="mr-1" size={16} />Download PDF</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#" className="flex items-center"><Linkedin className="mr-1" size={16} />Share on LinkedIn</a>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <a href="#" className="flex items-center"><CheckSquare className="mr-1" size={16} />Verify Certificate</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3 – CERTIFICATE GALLERY */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Certificate Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mockCertificates.map((cert) => (
            <Card key={cert.id} className="p-4 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{cert.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-200 h-32 flex items-center justify-center text-slate-500 mb-2">
                  Image
                </div>
                <p className="text-xs text-slate-600">Issued: {cert.date}</p>
                <p className="text-xs text-slate-600">Status: {cert.status}</p>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" className="flex items-center"><Certificate size={14} className="mr-1" />View</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" className="flex items-center"><Download size={14} className="mr-1" />Download</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" className="flex items-center"><Linkedin size={14} className="mr-1" />Share</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 4 – LOCKED CERTIFICATES */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Locked Certificates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { level: "Level 2 Certification", note: "Complete Module 2" },
            { level: "Advanced Facilitator", note: "Complete Level 3" },
            { level: "Master Facilitator", note: "Complete All Levels" },
          ].map((item, idx) => (
            <Card key={idx} className="p-4 opacity-50">
              <CardHeader className="flex items-center space-x-2">
                <Lock className="text-slate-400" />
                <CardTitle className="text-sm font-medium">{item.level}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 5 – ACHIEVEMENT BADGES */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Achievement Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mockAchievementBadges.map((badge) => (
            <Card
              key={badge.id}
              className={`p-4 flex items-center space-x-2 ${badge.unlocked ? "" : "opacity-40"}`}
            >
              <Badge variant={badge.unlocked ? "pro" : "neutral"} size="sm" className="mr-2">
                {badge.title}
              </Badge>
              <span className="text-sm">{badge.title}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 6 – LEARNING MILESTONES TIMELINE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Learning Milestones</h2>
        <div className="flex items-center overflow-x-auto space-x-4 pb-4">
          {[
            "Registered",
            "Completed Level 1",
            "Completed Challenges",
            "Level 2",
            "Certified Facilitator",
            "Master Facilitator",
          ].map((label, idx) => (
            <div key={idx} className="flex items-center">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="mt-1 text-sm whitespace-nowrap">{label}</span>
              </div>
              {idx < 5 && <ArrowRight className="text-slate-400" />}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7 – VERIFICATION CARD */}
      <section>
        <Card gradientBorder className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="text-primary">Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Certificate ID: <span className="font-medium">FSP-L1-000145</span></p>
            <p className="mb-4">Verification Status: <Badge variant="success" size="sm">Verified</Badge></p>
            <div className="bg-slate-200 h-32 flex items-center justify-center mb-4">
              QR Code Placeholder
            </div>
            <Button variant="primary" size="sm" asChild>
              <a href="#" className="flex items-center"><CheckSquare className="mr-1" size={16} />Verify Online</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 8 – LEARNING STATISTICS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Learning Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Courses Completed" value={12} color="blue" />
          <StatCard title="Events Attended" value={20} color="orange" />
          <StatCard title="Challenges Completed" value={4} color="green" />
          <StatCard title="Certificates Earned" value={certificatesEarned} color="purple" />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            Chart Placeholder 1
          </Card>
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            Chart Placeholder 2
          </Card>
        </div>
      </section>

      {/* SECTION 9 – SHARE YOUR ACHIEVEMENT */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Share Your Achievement</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center justify-center"><Linkedin size={20} className="mr-2" />LinkedIn</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center justify-center"><Facebook size={20} className="mr-2" />Facebook</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center justify-center"><MessageSquare size={20} className="mr-2" />WhatsApp</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center justify-center"><Mail size={20} className="mr-2" />Email</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center justify-center"><ClipboardCopy size={20} className="mr-2" />Copy Link</a>
          </Button>
        </div>
      </section>

      {/* SECTION 10 – RECOGNITION WALL */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Recognition Wall</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Top Learner",
            "Challenge Winner",
            "Best Contributor",
            "Most Active Member",
          ].map((title, i) => (
            <Card key={i} className="p-4 text-center">
              <p className="font-medium">{title}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 11 – QUICK ACTIONS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { label: "Download All Certificates", icon: <Download size={24} /> },
            { label: "View Learning Progress", icon: <Calendar size={24} /> },
            { label: "Continue Learning", icon: <ArrowRight size={24} /> },
            { label: "Share Achievement", icon: <Linkedin size={24} /> },
            { label: "Verify Certificate", icon: <CheckSquare size={24} /> },
          ].map((act, idx) => (
            <Button key={idx} variant="ghost" className="flex flex-col items-center p-4 h-24" asChild>
              <a href="#">
                {act.icon}
                <span className="mt-2 text-sm">{act.label}</span>
              </a>
            </Button>
          ))}
        </div>
      </section>

      {/* SECTION 12 – EMPTY STATE */}
      <section>
        <Card className="p-8 text-center">
          <p className="text-xl font-medium mb-4">No certificates available yet.</p>
          <p className="mb-4 text-slate-600">
            Complete your courses, challenges, and events to unlock your first FSP certificate.
          </p>
          <Button variant="primary" size="lg" asChild>
            <a href="#" className="flex items-center justify-center"><ArrowRight size={16} className="mr-2" />Continue Learning</a>
          </Button>
        </Card>
      </section>
    </div>
  );
}
