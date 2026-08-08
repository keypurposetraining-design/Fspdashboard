import React from "react";
import { mockInvoices } from "@/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, Download, ShieldCheck, FileText, ArrowRight, ExternalLink } from "lucide-react";

export const PaymentsView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              BILLING & INVOICES
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payments & Subscription
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View your payment history, download official tax receipts, and manage billing methods.
          </p>
        </div>

        <Button variant="outline" size="md" icon={<CreditCard className="w-4 h-4" />}>
          Update Payment Method
        </Button>
      </div>

      {/* Overview Cards (Payment Method + Next Billing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Method Card */}
        <Card hoverEffect>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0F4CFF]" />
              Default Payment Method
            </CardTitle>
            <Badge variant="success" size="sm">
              VERIFIED
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  VISA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Visa ending in 4242
                  </h4>
                  <p className="text-xs text-slate-500">Expires 12/2028</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Billing Summary */}
        <Card hoverEffect>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF7A00]" />
              Next Billing Date
            </CardTitle>
            <Badge variant="primary" size="sm">
              AUTO-RENEW
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">$99.00</span>
              <span className="text-xs text-slate-500 font-medium">/ month</span>
            </div>
            <p className="text-xs text-slate-600">
              Your subscription automatically renews on <strong className="text-slate-900">Sept 15, 2026</strong>.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History & Receipts</CardTitle>
          <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
            Download All (ZIP)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                  <th className="p-3.5 rounded-l-xl">Invoice ID</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 rounded-r-xl text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-[#0F4CFF]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3.5 text-slate-600">{inv.date}</td>
                    <td className="p-3.5 text-slate-800">{inv.description}</td>
                    <td className="p-3.5 font-bold text-slate-900">{inv.amount}</td>
                    <td className="p-3.5">
                      <Badge variant="success" size="sm" dot>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
