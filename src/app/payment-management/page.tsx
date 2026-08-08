import React from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import {
  mockPaymentRecords,
  mockRenewalCards,
  mockLearningLevelPayments,
  mockCoupons,
  mockRefundRequests,
  mockOutstandingPayments,
  mockRevenueAnalytics,
  mockFinanceReports,
  mockInvoices,
} from "@/data/mockData";
import { CreditCard, FileText, RefreshCw, Gift, CheckCircle2, XCircle } from "lucide-react";

export default function PaymentManagementPage() {
  // Empty state fallback
  const hasPayments = mockPaymentRecords && mockPaymentRecords.length > 0;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary-blue">Payment Management</h1>
        <p className="text-lg text-gray-600">Manage all FSP membership payments, level fees, renewals, invoices, and financial records.</p>
      </header>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-lg shadow p-4">
        <Input placeholder="Search Payment" className="flex-1 min-w-[200px]" />
        <Select options={["Paid", "Pending", "Failed"]} placeholder="Payment Status" />
        <Select options={["Annual", "Lifetime", "Corporate"]} placeholder="Membership Plan" />
        <Select options={["Level 1", "Level 2", "Level 3", "Level 4"]} placeholder="Learning Level" />
        <Select options={["Credit Card", "UPI", "Bank Transfer"]} placeholder="Payment Method" />
        <Select options={["January", "February", "March"]} placeholder="Month" />
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" className="flex items-center"><CreditCard className="mr-1 h-4 w-4" />Record Payment</Button>
          <Button variant="secondary" className="flex items-center"><FileText className="mr-1 h-4 w-4" />Generate Invoice</Button>
          <Button variant="secondary" className="flex items-center"><RefreshCw className="mr-1 h-4 w-4" />Export Report</Button>
          <Button variant="secondary" className="flex items-center"><Gift className="mr-1 h-4 w-4" />Revenue Dashboard</Button>
        </div>
      </div>

      {/* Section 1 – Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard title="Total Revenue" value="₹48,75,000" />
        <StatCard title="Revenue This Month" value="₹4,80,000" />
        <StatCard title="Pending Payments" value="₹1,35,000" />
        <StatCard title="Membership Renewals Due" value="48" />
        <StatCard title="Invoices Generated" value="1,285" />
        <StatCard title="Successful Transactions" value="1,212" />
        <StatCard title="Refunds" value="5" />
        <StatCard title="Outstanding Balance" value="₹2,40,000" />
      </div>

      {/* Section 2 – Revenue Analytics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Revenue Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Monthly Revenue Chart</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Membership Revenue Chart</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Level Revenue Chart</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Renewal Revenue Chart</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Corporate Revenue Chart</Card>
        </div>
      </section>

      {/* Section 3 – Payment Records Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Payment Records</h2>
        {hasPayments ? (
          <Table columns={[
            { header: "Invoice No", accessor: "invoiceNo" },
            { header: "Member", accessor: "member" },
            { header: "Member ID", accessor: "memberId" },
            { header: "Payment Type", accessor: "paymentType" },
            { header: "Amount", accessor: "amount" },
            { header: "GST", accessor: "gst" },
            { header: "Method", accessor: "method" },
            { header: "Transaction ID", accessor: "transactionId" },
            { header: "Date", accessor: "date" },
            { header: "Status", accessor: "status", render: (status) => (
                <Badge variant={status === "Paid" ? "success" : status === "Pending" ? "warning" : "destructive"}>{status}</Badge>
              ) },
            { header: "Actions", accessor: "actions", render: () => (
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost">View</Button>
                  <Button size="sm" variant="ghost">Edit</Button>
                  <Button size="sm" variant="ghost">Download</Button>
                  <Button size="sm" variant="ghost">Send</Button>
                </div>
              ) },
          ]} data={mockPaymentRecords} />
        ) : (
          <Card className="p-8 text-center">
            No payment records available.
            <Button className="mt-4" variant="primary">Record First Payment</Button>
          </Card>
        )}
      </section>

      {/* Section 4 – Membership Renewals */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Membership Renewals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRenewalCards.map((card) => (
            <Card key={card.memberName} className="p-4 rounded-lg shadow bg-white">
              <h3 className="font-medium">{card.memberName}</h3>
              <p>{card.membershipPlan}</p>
              <p className="text-sm text-gray-500">Expires: {card.expiryDate}</p>
              <p className="mt-2 font-semibold">Amount: {card.renewalAmount}</p>
              <Badge variant={card.reminderStatus === "Reminder Sent" ? "success" : "warning"} className="mt-1">{card.reminderStatus}</Badge>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="primary">Renew</Button>
                <Button size="sm" variant="secondary">Send Reminder</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 5 – Learning Level Payments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Learning Level Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockLearningLevelPayments.map((lvl) => (
            <Card key={lvl.level} className="p-4 text-center bg-white rounded-lg shadow">
              <h3 className="font-medium mb-1">{lvl.level}</h3>
              <p className="text-xl font-semibold mb-1">{lvl.price}</p>
              <p>{lvl.paidMembers} Paid Members</p>
              <p>{lvl.pending} Pending</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Invoices */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Invoices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockInvoices.map((inv) => (
            <Card key={inv.id} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-medium">{inv.invoiceNumber}</h3>
              <p>{inv.member}</p>
              <p className="mt-1">Amount: {inv.amount} (+ GST {inv.gst})</p>
              <Badge variant={inv.status === "Paid" ? "success" : inv.status === "Pending" ? "warning" : "destructive"} className="mt-2">{inv.status}</Badge>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary">Download PDF</Button>
                <Button size="sm" variant="secondary">Email Invoice</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 – Discounts & Coupons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Discounts & Coupons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockCoupons.map((c) => (
            <Card key={c.title} className="p-4 bg-white rounded-lg shadow flex flex-col justify-between">
              <h3 className="font-medium">{c.title}</h3>
              <p className="text-2xl font-semibold mt-2">{c.discountPercent}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="primary">Create Coupon</Button>
                <Button size="sm" variant="secondary">Edit Coupon</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 8 – Refund Management */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Refund Management</h2>
        <Table columns={[
          { header: "Request ID", accessor: "requestId" },
          { header: "Member", accessor: "member" },
          { header: "Reason", accessor: "reason" },
          { header: "Amount", accessor: "amount" },
          { header: "Status", accessor: "status", render: (s) => (
              <Badge variant={s === "Approved" ? "success" : s === "Pending" ? "warning" : "destructive"}>{s}</Badge>
            ) },
          { header: "Approved By", accessor: "approvedBy" },
          { header: "Date", accessor: "date" },
          { header: "Actions", accessor: "actions", render: () => (
              <div className="flex gap-2"><Button size="sm" variant="primary">Approve</Button><Button size="sm" variant="destructive">Reject</Button></div>
            ) },
        ]} data={mockRefundRequests} />
      </section>

      {/* Section 9 – Outstanding Payments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Outstanding Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockOutstandingPayments.map((op) => (
            <Card key={op.member} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-medium">{op.member}</h3>
              <p>Pending: {op.pendingAmount}</p>
              <p>{op.daysOverdue} days overdue</p>
              <p>Reminders sent: {op.reminderCount}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary">WhatsApp</Button>
                <Button size="sm" variant="secondary">Email</Button>
                <Button size="sm" variant="secondary">Call</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 10 – Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="flex flex-col items-center p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"><CreditCard className="h-8 w-8 mb-2" /><span>Record Payment</span></Card>
          <Card className="flex flex-col items-center p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"><RefreshCw className="h-8 w-8 mb-2" /><span>Renew Membership</span></Card>
          <Card className="flex flex-col items-center p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"><FileText className="h-8 w-8 mb-2" /><span>Generate Invoice</span></Card>
          <Card className="flex flex-col items-center p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"><Gift className="h-8 w-8 mb-2" /><span>Download GST Report</span></Card>
          <Card className="flex flex-col items-center p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"><Gift className="h-8 w-8 mb-2" /><span>Export Excel</span></Card>
          <Card className="flex flex-col items-center p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"><Gift className="h-8 w-8 mb-2" /><span>View Analytics</span></Card>
        </div>
      </section>

      {/* Section 11 – Finance Reports */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">Finance Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Monthly Collection Chart</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Payment Method Distribution</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Outstanding Payments Chart</Card>
          <Card className="h-64 flex items-center justify-center bg-white rounded-lg shadow">Revenue Growth Chart</Card>
        </div>
      </section>

      {/* Section 12 – AI Finance Assistant */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary-blue">AI Finance Assistant</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {["Generate Payment Reminder","Generate Invoice Email","Generate WhatsApp Reminder","Generate Revenue Summary","Generate Monthly Finance Report"].map((title) => (
            <Card key={title} className="p-4 bg-white rounded-lg shadow flex flex-col justify-between"><h3 className="font-medium mb-2">{title}</h3><Button size="sm" variant="primary">Run</Button></Card>
          ))}
        </div>
      </section>
    </div>
  );
}
