import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Settings, Search, Filter, Plus, Upload, Download, Save, RefreshCw, Zap, CheckSquare, XSquare } from "lucide-react";
import { mockSystemSettings } from "@/data/mockData";

export default function SystemSettingsIntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [settings] = useState(mockSystemSettings);

  const filteredIntegrations = settings.integrations.filter((int) =>
    int.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">System Settings & Integrations</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Configure the complete FSP Member Hub platform, integrations, branding, permissions and system preferences.
        </p>
      </section>

      {/* Top Action Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Global Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          <Button variant="outline" size="sm" asChild>
            <span className="flex items-center"><Search className="w-4 h-4 mr-1" /> Search</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" asChild>
            <span className="flex items-center"><Save className="w-4 h-4 mr-1" /> Save Changes</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><RefreshCw className="w-4 h-4 mr-1" /> Reset Settings</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Upload className="w-4 h-4 mr-1" /> Import Settings</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Download className="w-4 h-4 mr-1" /> Export Settings</span>
          </Button>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Integrations" value={settings.integrations.length.toString()} />
        <StatCard title="Enabled" value={settings.integrations.filter(i => i.enabled).length.toString()} />
        <StatCard title="Roles" value={settings.permissions.length.toString()} />
        <StatCard title="Feature Toggles" value={settings.featureToggles.length.toString()} />
      </section>

      {/* Platform Branding */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Platform Branding</h2>
        <Card className="p-6 flex items-center gap-6">
          <img src={settings.branding.logoUrl} alt="Logo" className="w-24 h-24 object-cover rounded-md border" />
          <div className="space-y-2">
            <div><span className="font-medium">Primary Color:</span> <Badge variant="default" className="ml-2" style={{ backgroundColor: settings.branding.primaryColor }}>{settings.branding.primaryColor}</Badge></div>
            <div><span className="font-medium">Secondary Color:</span> <Badge variant="default" className="ml-2" style={{ backgroundColor: settings.branding.secondaryColor }}>{settings.branding.secondaryColor}</Badge></div>
            <div><span className="font-medium">Accent Color:</span> <Badge variant="default" className="ml-2" style={{ backgroundColor: settings.branding.accentColor }}>{settings.branding.accentColor}</Badge></div>
          </div>
        </Card>
      </section>

      {/* Integrations */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((int) => (
            <Card key={int.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Zap className="w-5 h-5" /><span className="font-medium">{int.name}</span></div>
              <Badge variant={int.enabled ? "success" : "destructive"}>{int.enabled ? "Enabled" : "Disabled"}</Badge>
            </Card>
          ))}
        </div>
      </section>

      {/* Roles & Permissions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Roles & Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.permissions.map((role) => (
            <Card key={role.role} className="p-4">
              <h3 className="font-medium text-lg mb-2">{role.role}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Edit Settings: {role.canEditSettings ? <CheckSquare className="inline w-4 h-4 text-green-500" /> : <XSquare className="inline w-4 h-4 text-red-500" />}</li>
                <li>Manage Users: {role.canManageUsers ? <CheckSquare className="inline w-4 h-4 text-green-500" /> : <XSquare className="inline w-4 h-4 text-red-5" />}</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <span className="flex items-center"><Settings className="w-4 h-4 mr-1" /> Edit Role</span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Toggles */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Feature Toggles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.featureToggles.map((feat) => (
            <Card key={feat.feature} className="p-4 flex items-center justify-between">
              <span>{feat.feature}</span>
              <Badge variant={feat.enabled ? "success" : "destructive"}>{feat.enabled ? "On" : "Off"}</Badge>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
