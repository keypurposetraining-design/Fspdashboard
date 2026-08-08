// src/app/payments/page.tsx
import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Download, CreditCard, Calendar, ArrowRight, HelpCircle, CheckCircle } from "lucide-react";
import { mockLearningLevels, mockPaymentHistory, mockInvoices } from "@/data/mockData";

export const metadata: Metadata = {
  title: "Payments & Billing | FSP Member Hub",
  description: "Manage your membership payments, invoices, and billing history.",
};

export default function PaymentsPage() {
  return (
    <div className="space-y-8 py-8 px-4 md:px-8 lg:px-12">
      {/* PAGE HEADER */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-primary">Payments & Billing</h1>
        <p className="mt-2 text-lg text-slate-600">
          Manage your membership payments, learning level fees, invoices, and billing history.
        </p>
      </section>

      {/* SECTION 1 – PAYMENT OVERVIEW */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Membership Status"
          value="Active"
          icon={<Badge variant="success" size="sm" className="ml-2">Active</Badge>}
          color="green"
        />
        <StatCard
          title="Total Amount Paid"
          value="₹14,000"
          icon={<CreditCard size={20} className="text-primary" />}
          color="blue"
        />
        <StatCard
          title="Pending Amount"
          value="₹7,000"
          icon={<Badge variant="warning" size="sm" className="ml-2">Pending</Badge>}
          color="orange"
        />
        <StatCard
          title="Next Renewal"
          value="31 Jul 2027"
          subtitle="360 Days Remaining"
          icon={<Calendar size={20} className="text-primary" />}
          color="purple"
        />
      </section>

      {/* SECTION 2 – MEMBERSHIP PAYMENT */}
      <section>
        <Card gradientBorder className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader className="flex flex-col items-start space-y-2">
            <CardTitle className="text-2xl text-primary">Membership Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">FSP Annual Membership</p>
              <p className="text-sm text-slate-600">Fee: <span className="font-semibold">₹3,000</span></p>
              <p className="text-sm text-slate-600">Status: <Badge variant="success" size="sm" className="ml-1">Paid</Badge></p>
              <p className="text-sm text-slate-600">Payment Date: 01 Aug 2026</p>
              <p className="text-sm text-slate-600">Valid Until: 31 Jul 2027</p>
            </div>
            <div className="flex flex-col items-start justify-center space-y-2">
              <Button variant="outline" size="sm" asChild>
                <a href="#" className="flex items-center"><Download className="mr-1" size={16} />Download Invoice</a>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <a href="#" className="flex items-center"><ArrowRight className="mr-1" size={16} />View Receipt</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3 – LEARNING LEVELS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Learning Levels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockLearningLevels.map((lvl) => (
            <Card key={lvl.level} className="p-4">
              <CardHeader className="pb-2 text-sm font-medium text-primary">{lvl.title}</CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Fee: <span className="font-semibold">{lvl.fee}</span></p>
                <p className="text-sm text-slate-600 mt-1">
                  Status: 
                  {lvl.status === "Paid" && <Badge variant="success" size="sm" className="ml-1">Paid</Badge>}
                  {lvl.status === "Pending" && <Badge variant="warning" size="sm" className="ml-1">Pending</Badge>}
                  {lvl.status === "Locked" && <Badge variant="neutral" size="sm" className="ml-1">Locked</Badge>}
                </p>
                <div className="mt-2">
                  {lvl.action === "Pay Now" && (
                    <Button variant="primary" size="sm" asChild>
                      <a href="#" className="flex items-center"><ArrowRight size={14} className="mr-1" />Pay Now</a>
                    </Button>
                  )}
                  {lvl.action === "Completed" && (
                    <Button variant="outline" size="sm" disabled>
                      View Invoice
                    </Button>
                  )}
                  {lvl.action === "Unavailable" && (
                    <Button variant="outline" size="sm" disabled>
                      Not Available
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 4 – PAYMENT TIMELINE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Payment Timeline</h2>
        <div className="border-l-2 border-primary pl-6 space-y-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-primary rounded-full mr-3" />
            <span className="font-medium">Annual Membership – Paid</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-primary rounded-full mr-3" />
            <span className="font-medium">Level 1 – Paid</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
            <span className="font-medium">Level 2 – Pending</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-slate-400 rounded-full mr-3" />
            <span className="font-medium">Level 3 – Locked</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-slate-400 rounded-full mr-3" />
            <span className="font-medium">Level 4 – Upcoming</span>
          </div>
        </div>
      </section>

      {/* SECTION 5 – PAYMENT HISTORY */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Payment History</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockPaymentHistory.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.id}</td>
                  <td className="p-3">{p.date}</td>
                  <td className="p-3">{p.description}</td>
                  <td className="p-3">{p.amount}</td>
                  <td className="p-3">
                    {p.status === "Paid" && <Badge variant="success" size="sm">Paid</Badge>}
                    {p.status === "Pending" && <Badge variant="warning" size="sm">Pending</Badge>}
                  </td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={p.invoiceUrl} className="flex items-center"><Download size={14} className="mr-1" />Download</a>
                    </Button>
                  </td>
                </tr>
              ))}
              {/* Example row for pending Level 2 */}
              <tr className="border-t">
                <td className="p-3 font-medium">INV003</td>
                <td className="p-3">Pending</td>
                <td className="p-3">Level 2</td>
                <td className="p-3">₹7,000</td>
                <td className="p-3"><Badge variant="warning" size="sm">Pending</Badge></td>
                <td className="p-3">
                  <Button variant="primary" size="sm" asChild>
                    <a href="#" className="flex items-center"><ArrowRight size={14} className="mr-1" />Pay</a>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6 – RENEWAL REMINDER */}
      <section>
        <Card gradientBorder className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="text-primary">Renewal Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold mb-2">Membership expires in <span className="text-primary">360 Days</span></p>
            <p className="mb-4">Renew before expiry to continue accessing:</p>
            <ul className="list-disc list-inside mb-4">
              <li>Community</li>
              <li>Courses</li>
              <li>Events</li>
              <li>Certificates</li>
            </ul>
            <Button variant="primary" size="md" asChild>
              <a href="#" className="flex items-center"><ArrowRight size={16} className="mr-1" />Renew Membership</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 7 – INVOICES */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Invoices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockInvoices.map((inv) => (
            <Card key={inv.id} className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{inv.invoiceNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Amount: {inv.amount}</p>
                <p className="text-xs text-slate-500 mt-1">GST Included</p>
                <div className="flex space-x-2 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={inv.downloadUrl} className="flex items-center"><Download size={14} className="mr-1" />PDF</a>
                  </Button>
                  <Button variant="outline" size="sm" disabled>Share</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 8 – PAYMENT ANALYTICS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Payment Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Paid"
            value="₹14,000"
            icon={<CreditCard size={20} className="text-primary" />}
            color="green"
          />
          <StatCard
            title="Pending"
            value="₹7,000"
            icon={<Badge variant="warning" size="sm" />}
            color="orange"
          />
          <StatCard
            title="Completed Transactions"
            value={3}
            icon={<CheckCircle size={20} className="text-primary" />}
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value="100%"
            icon={<CheckCircle size={20} className="text-primary" />}
            color="green"
          />
        </div>
      </section>

      {/* SECTION 9 – FAQs */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">FAQs</h2>
        <div className="space-y-2">
          {["How do I renew?", "How do I download my invoice?", "Can I pay later?", "Who should I contact?"].map((q, i) => (
            <details key={i} className="rounded border p-3 bg-slate-50">
              <summary className="font-medium cursor-pointer flex items-center">
                <HelpCircle className="mr-2" size={16} />{q}
              </summary>
              <p className="mt-2 text-sm text-slate-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </details>
          ))}
        </div>
      </section>

      {/* SECTION 10 – SUPPORT */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Billing Support", icon: <CreditCard size={20} /> },
            { title: "WhatsApp Support", icon: <svg className="w-5 h-5" fill="currentColor"><path d="M2 2h20v20H2z" /></svg> },
            { title: "Raise Ticket", icon: <svg className="w-5 h-5" fill="currentColor"><path d="M2 2h20v20H2z" /></svg> },
            { title: "Email Accounts Team", icon: <svg className="w-5 h-5" fill="currentColor"><path d="M2 2h20v20H2z" /></svg> },
          ].map((item, idx) => (
            <Card key={idx} className="p-4 flex items-center space-x-3">
              <div className="text-primary">{item.icon}</div>
              <span className="font-medium">{item.title}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 11 – QUICK ACTIONS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: "Pay Now", icon: <ArrowRight size={24} /> },
            { label: "Download Invoice", icon: <Download size={24} /> },
            { label: "Renew Membership", icon: <Calendar size={24} /> },
            { label: "View Payment History", icon: <CreditCard size={24} /> },
            { label: "Contact Accounts", icon: <HelpCircle size={24} /> },
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
          <p className="text-xl font-medium mb-4">No payment records available.</p>
          <Button variant="primary" size="lg" asChild>
            <a href="#" className="flex items-center justify-center"><ArrowRight size={16} className="mr-2" />Make First Payment</a>
          </Button>
        </Card>
      </section>
    </div>
  );
}
