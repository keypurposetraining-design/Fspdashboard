import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Switch } from "@/components/ui/Switch";
import {
  mockMembershipPlans,
  mockMemberships,
  mockRenewalDue,
  mockMembershipRules,
  mockMembershipBenefits,
  mockQuickActions,
} from "@/data/mockData";
import { Plus, Edit, RefreshCcw, ArrowUp, Download, Mail, FileInvoice, Filter, Search } from "lucide-react";

export default function MembershipManagementPage() {
  const [benefits, setBenefits] = useState(mockMembershipBenefits);

  const toggleBenefit = (index) => {
    const newBenefits = [...benefits];
    newBenefits[index].enabled = !newBenefits[index].enabled;
    setBenefits(newBenefits);
  };

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">Membership Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage all FSP membership plans, renewals, upgrades, pricing, and member subscriptions.
        </p>
      </section>

      {/* Top Action Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search Membership" className="max-w-sm" />
          <Button variant="outline" size="sm" asChild>
            <span className="flex items-center"><Search className="w-4 h-4 mr-1" />Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild>
            <span className="flex items-center"><Filter className="w-4 h-4 mr-1" />Filter</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" asChild>
            <span className="flex items-center"><Plus className="w-4 h-4 mr-1" />Create Membership Plan</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><RefreshCcw className="w-4 h-4 mr-1" />Renew Membership</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Download className="w-4 h-4 mr-1" />Export Report</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Mail className="w-4 h-4 mr-1" />Membership Analytics</span>
          </Button>
        </div>
      </section>

      {/* Section 1 – Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Memberships" value="1250" />
        <StatCard title="Active" value="1180" />
        <StatCard title="Expiring This Month" value="48" />
        <StatCard title="Expired" value="22" />
        <StatCard title="Renewed This Month" value="75" />
        <StatCard title="Renewal Revenue" value="₹2,85,000" />
      </section>

      {/* Section 2 – Membership Plans */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Membership Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMembershipPlans.map((plan) => (
            <Card key={plan.id} className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground"><strong>Validity:</strong> {plan.validity}</p>
                <p className="text-sm text-muted-foreground"><strong>Price:</strong> {plan.price}</p>
                <p className="text-sm text-muted-foreground"><strong>Members:</strong> {plan.members}</p>
                <p className="text-sm text-muted-foreground"><strong>Status:</strong> {plan.status}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-4 self-start" asChild>
                <span className="flex items-center"><Edit className="w-4 h-4 mr-1" />Edit Plan</span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 – Membership Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Memberships</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Member Name</th>
                <th className="p-3">Member ID</th>
                <th className="p-3">Membership Plan</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Remaining Days</th>
                <th className="p-3">Renewal Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Auto Renewal</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockMemberships.map((m, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={m.memberId === "FSP000101" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"} />
                      <AvatarFallback>{m.memberName[0]}</AvatarFallback>
                    </Avatar>
                    {m.memberName}
                  </td>
                  <td className="p-3">{m.memberId}</td>
                  <td className="p-3">{m.plan}</td>
                  <td className="p-3">{m.startDate}</td>
                  <td className="p-3">{m.expiryDate}</td>
                  <td className="p-3">{m.remainingDays}</td>
                  <td className="p-3">{m.renewalAmount}</td>
                  <td className="p-3">
                    <Badge variant={m.status === "Active" ? "success" : "destructive"}>{m.status}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={m.autoRenewal ? "success" : "secondary"}>
                      {m.autoRenewal ? "On" : "Off"}
                    </Badge>
                  </td>
                  <td className="p-3 flex space-x-1">
                    <Button variant="ghost" size="sm" asChild><span>View</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Edit</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Renew</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Upgrade</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Pause</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Cancel</span></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 – Renewal Center */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Renewal Center</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Days Remaining</th>
                <th className="p-3">Renewal Fee</th>
                <th className="p-3">Reminder Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockRenewalDue.map((r, i) => (
                <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.expiryDate}</td>
                  <td className="p-3">{r.daysRemaining} Days</td>
                  <td className="p-3">{r.renewalFee}</td>
                  <td className="p-3">
                    <Badge variant={r.reminderStatus === "Reminder Sent" ? "success" : "secondary"}>
                      {r.reminderStatus}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" asChild>
                      <span className="flex items-center"><RefreshCcw className="w-4 h-4 mr-1" />Renew Now</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 – Membership Rules */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Membership Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMembershipRules.map((rule, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-medium mb-1">{rule.title}</h3>
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Membership Benefits */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Membership Benefits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {benefits.map((b, i) => (
            <Card key={i} className="p-4 flex items-center justify-between">
              <span>{b.name}</span>
              <Switch checked={b.enabled} onCheckedChange={() => toggleBenefit(i)} />
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 – Upgrade & Downgrade Workflow */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Upgrade & Downgrade</h2>
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <p className="font-medium">Current Plan</p>
              <Badge variant="outline">FSP Annual Membership</Badge>
            </div>
            <span className="text-2xl">&#8594;</span>
            <div className="text-center">
              <p className="font-medium">Upgrade Options</p>
              <Badge variant="outline">Corporate Membership</Badge>
            </div>
            <span className="text-2xl">&#8594;</span>
            <div className="text-center">
              <p className="font-medium">Price Difference</p>
              <Badge variant="secondary">+ ₹2,000</Badge>
            </div>
            <span className="text-2xl">&#8594;</span>
            <div className="text-center">
              <Button variant="default" size="sm">Confirm</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Section 8 – Renewal Analytics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Renewal Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="h-64 flex items-center justify-center bg-muted"><span className="text-muted-foreground">Renewals by Month (Chart Placeholder)</span></Card>
          <Card className="h-64 flex items-center justify-center bg-muted"><span className="text-muted-foreground">Membership Growth (Chart Placeholder)</span></Card>
          <Card className="h-64 flex items-center justify-center bg-muted"><span className="text-muted-foreground">Expired vs Active (Chart Placeholder)</span></Card>
          <Card className="h-64 flex items-center justify-center bg-muted"><span className="text-muted-foreground">Renewal Revenue (Chart Placeholder)</span></Card>
        </div>
      </section>

      {/* Section 9 – Reminder Timeline */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reminder Timeline</h2>
        <div className="flex overflow-x-auto gap-4 py-2">
          {mockReminderTimeline.map((step, i) => (
            <Card key={i} className="flex-none px-4 py-2"><span>{step}</span></Card>
          ))}
        </div>
      </section>

      {/* Section 10 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mockQuickActions.map((action, i) => (
            <Card key={i} className="p-4 flex flex-col items-center hover:shadow-lg transition-shadow">
              <Button variant="ghost" size="lg" className="flex flex-col items-center" asChild>
                <span className="flex flex-col items-center">
                  <span className="text-3xl mb-2 text-primary">{action.icon}</span>
                  {action.label}
                </span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 11 – Empty State */}
      {mockMembershipPlans.length === 0 && (
        <section className="text-center py-12">
          <p className="text-xl mb-4">No membership plans available.</p>
          <Button size="lg" asChild>
            <span className="flex items-center"><Plus className="w-5 h-5 mr-2" />Create First Membership Plan</span>
          </Button>
        </section>
      )}
    </main>
  );
}
