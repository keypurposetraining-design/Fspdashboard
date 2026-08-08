// src/app/certificate-management/page.tsx
import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
  Download,
  Certificate,
  Plus,
  Upload,
  BarChart2,
  PieChart,
  Calendar,
  HelpCircle,
  CheckSquare,
  Mail,
  ArrowRight,
  Settings,
  MessageSquare,
  Linkedin,
  Award,
} from "lucide-react";
import {
  mockCertificateTemplates,
  mockIssuedCertificates,
  mockVerificationRequests,
  mockCertificateAnalytics,
} from "@/data/mockData";

export const metadata: Metadata = {
  title: "Certificate Management | FSP Admin",
  description: "Admin portal to create, issue, verify and manage certificates.",
};

export default function CertificateManagementPage() {
  // Overview stats
  const totalIssued = mockIssuedCertificates.length;
  const pending = mockIssuedCertificates.filter((c) => c.status === "Pending").length;
  const templates = mockCertificateTemplates.length;
  const verified = mockVerificationRequests.filter((v) => v.status === "Verified").length;
  const revoked = mockIssuedCertificates.filter((c) => c.status === "Revoked").length;
  const downloads = 8420; // static per spec

  return (
    <div className="space-y-10 py-8 px-4 md:px-8 lg:px-12">
      {/* PAGE HEADER */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-primary">Certificate Management</h1>
        <p className="mt-2 text-lg text-slate-600">
          Create, issue, verify and manage all FSP certificates from one centralized dashboard.
        </p>
      </section>

      {/* TOP ACTION BAR */}
      <section className="flex flex-col md:flex-row items-center gap-4">
        <Input placeholder="Search Certificate..." className="flex-1" />
        <Select>
          <option>Certificate Type</option>
          <option>Course</option>
          <option>Event</option>
        </Select>
        <Select>
          <option>Member</option>
          <option>All Members</option>
        </Select>
        <Select>
          <option>Status</option>
          <option>Issued</option>
          <option>Pending</option>
        </Select>
        <div className="flex gap-2">
          <Button variant="primary" asChild>
            <a href="#" className="flex items-center"><Plus className="mr-1" size={16} />Issue Certificate</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center"><Upload className="mr-1" size={16} />Create Template</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="#" className="flex items-center"><Download className="mr-1" size={16} />Bulk Generate</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#" className="flex items-center"><Download className="mr-1" size={16} />Export Report</a>
          </Button>
        </div>
      </section>

      {/* SECTION 1 – OVERVIEW CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Certificates Issued" value={totalIssued} color="blue" />
        <StatCard title="Pending Approval" value={pending} color="orange" />
        <StatCard title="Templates Available" value={templates} color="green" />
        <StatCard title="Verified Certificates" value={verified} color="purple" />
        <StatCard title="Revoked" value={revoked} color="red" />
        <StatCard title="Downloads" value={downloads} color="teal" />
      </section>

      {/* SECTION 2 – CERTIFICATE TEMPLATES */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Certificate Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockCertificateTemplates.map((tmpl) => (
            <Card key={tmpl.id} className="p-4 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium truncate">{tmpl.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 h-32 flex items-center justify-center text-slate-500 mb-2">
                  Preview
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" className="flex items-center"><Certificate className="mr-1" size={14} />Edit</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" className="flex items-center"><Copy className="mr-1" size={14} />Duplicate</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 3 – ISSUE CERTIFICATES TABLE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Issue Certificates</h2>
        <Table
          columns={[
            { header: "Member", accessor: "member" },
            { header: "Member ID", accessor: "memberId" },
            { header: "Course/Event", accessor: "courseOrEvent" },
            { header: "Eligibility", accessor: "eligibility" },
            { header: "Status", accessor: "status" },
            { header: "Issue Date", accessor: "issueDate" },
            {
              header: "Actions",
              accessor: "actions",
              render: (row) => (
                <div className="flex space-x-1">
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Certificate className="mr-1" size={12} />Issue</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Download className="mr-1" size={12} />Preview</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Mail className="mr-1" size={12} />Email</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Download className="mr-1" size={12} />Download</a>
                  </Button>
                </div>
              ),
            },
          ]}
          data={mockIssuedCertificates.map((c) => ({
            member: c.member,
            memberId: c.memberId,
            courseOrEvent: c.courseOrEvent,
            eligibility: c.eligibility,
            status: c.status,
            issueDate: c.issueDate,
          }))}
        />
      </section>

      {/* SECTION 4 – CERTIFICATE PREVIEW */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Certificate Preview</h2>
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="bg-slate-200 h-48 flex items-center justify-center">Certificate Preview</div>
            <div className="space-y-2">
              <p className="font-medium">FSP Certificate Title</p>
              <p>Member Name: <span className="font-semibold">John Doe</span></p>
              <p>Program: <span className="font-semibold">Advanced Facilitator</span></p>
              <p>Completion Date: <span className="font-semibold">01 Aug 2026</span></p>
              <p>Certificate No: <span className="font-semibold">FSP-2026-001</span></p>
              <div className="bg-slate-100 h-24 flex items-center justify-center my-2">QR Code</div>
              <p>Digital Signature: <span className="font-semibold">Facilitator Director</span></p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 5 – BULK GENERATOR */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Bulk Certificate Generator</h2>
        <Card className="p-4">
          <CardContent className="flex flex-col space-y-4">
            <Select>
              <option>Select Course</option>
            </Select>
            <Select>
              <option>Select Members</option>
            </Select>
            <div className="flex space-x-2">
              <Button variant="primary"><Download className="mr-1" size={16} />Generate Certificates</Button>
              <Button variant="outline"><Mail className="mr-1" size={16} />Email Certificates</Button>
              <Button variant="secondary"><Download className="mr-1" size={16} />Download ZIP</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 6 – VERIFICATION PANEL */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Certificate Verification</h2>
        <Card className="p-4">
          <CardContent className="space-y-3">
            <Input placeholder="Search by Certificate ID, Member Name, QR Code" />
            <Select>
              <option>Status</option>
              <option>Verified</option>
              <option>Expired</option>
              <option>Revoked</option>
            </Select>
            <Table
              columns={[
                { header: "Certificate ID", accessor: "certificateId" },
                { header: "Member", accessor: "member" },
                { header: "Request Date", accessor: "requestDate" },
                { header: "Status", accessor: "status" },
              ]}
              data={mockVerificationRequests.map((v) => ({
                certificateId: v.certificateId,
                member: v.member,
                requestDate: v.requestDate,
                status: v.status,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      {/* SECTION 7 – ANALYTICS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Certificate Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <BarChart2 size={48} className="text-slate-500" />
            <span className="ml-2">Certificates Issued Monthly</span>
          </Card>
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <Download size={48} className="text-slate-500" />
            <span className="ml-2">Downloads</span>
          </Card>
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <CheckSquare size={48} className="text-slate-500" />
            <span className="ml-2">Verification Requests</span>
          </Card>
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <PieChart size={48} className="text-slate-500" />
            <span className="ml-2">Course‑wise Certificates</span>
          </Card>
        </div>
      </section>

      {/* SECTION 8 – HISTORY TIMELINE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Certificate History</h2>
        <Card className="p-4">
          <CardContent className="flex flex-col space-y-2">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-primary rounded-full mr-2"></span>Generated
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>Issued
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>Downloaded
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-purple-500 rounded-full mr-2"></span>Verified
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 9 – DIGITAL SIGNATURE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Digital Signature</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Upload Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline"><Upload className="mr-1" size={16} />Choose File</Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Upload Seal</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline"><Upload className="mr-1" size={16} />Choose File</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 10 – QUICK ACTIONS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          <Button variant="primary"><Certificate className="mr-1" size={16} />Issue Certificate</Button>
          <Button variant="outline"><Download className="mr-1" size={16} />Bulk Generate</Button>
          <Button variant="secondary"><CheckSquare className="mr-1" size={16} />Verify Certificate</Button>
          <Button variant="ghost"><Download className="mr-1" size={16} />Download Report</Button>
          <Button variant="outline"><Upload className="mr-1" size={16} />Upload Template</Button>
        </div>
      </section>

      {/* SECTION 11 – AI ASSISTANT */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">AI Certificate Assistant</h2>
        <Card className="p-4">
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline"><Settings className="mr-1" size={16} />Generate Certificate Text</Button>
            <Button variant="outline"><MessageSquare className="mr-1" size={16} />Generate Appreciation Message</Button>
            <Button variant="outline"><Mail className="mr-1" size={16} />Generate Email</Button>
            <Button variant="outline"><Linkedin className="mr-1" size={16} />Generate LinkedIn Caption</Button>
            <Button variant="outline"><Award className="mr-1" size={16} />Generate Award Description</Button>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 12 – EMPTY STATE */}
      <section>
        <Card className="p-8 text-center">
          <p className="text-xl font-medium mb-4">No certificates have been created.</p>
          <Button variant="primary" asChild>
            <a href="#" className="flex items-center justify-center"><Plus className="mr-2" size={16} />Create First Template</a>
          </Button>
        </Card>
      </section>
    </div>
  );
}
