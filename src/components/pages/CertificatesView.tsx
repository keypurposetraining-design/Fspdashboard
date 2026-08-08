import React from "react";
import { mockCertificates } from "@/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Award, Trophy, Download, Share2, ShieldCheck, CheckCircle2, QrCode } from "lucide-react";

export const CertificatesView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" size="sm" dot>
              ACCREDITED & VERIFIED
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Certificates & Accreditations
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Your verified credentials, digital badges, and official FSP facilitator accreditations.
          </p>
        </div>

        <Button variant="primary" size="md" icon={<Share2 className="w-4 h-4" />}>
          Share Credentials Profile
        </Button>
      </div>

      {/* Grid of Certificate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockCertificates.map((cert) => (
          <Card key={cert.id} gradientBorder hoverEffect>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F4CFF] to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <Badge variant="pro" size="sm">
                  VERIFIED ACCREDITATION
                </Badge>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-wider block mb-1">
                  {cert.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {cert.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Credential ID: <strong className="text-slate-700">{cert.credentialId}</strong>
                </p>
              </div>

              {/* Skills Verified Tags */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Skills Verified:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cert.skillsVerified.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Issue Date & Verification Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-3 border-t border-slate-100">
                <span>Issued: {cert.issueDate}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Publicly Verifiable
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="primary" size="sm" fullWidth icon={<Download className="w-3.5 h-3.5" />}>
                  Download Certificate PDF
                </Button>
                <Button variant="outline" size="sm" icon={<Share2 className="w-3.5 h-3.5" />}>
                  Add to LinkedIn
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
