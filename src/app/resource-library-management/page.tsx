// src/app/resource-library-management/page.tsx
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
  Upload,
  Plus,
  Folder,
  FileText,
  Video,
  Image,
  BarChart2,
  PieChart,
  Settings,
  CheckSquare,
  Calendar,
  HelpCircle,
  Mail,
  ArrowRight,
} from "lucide-react";
import {
  mockResources,
  mockResourceCategories,
  mockResourceFolders,
  mockFeaturedResources,
  mockAccessControls,
  mockCertificateAnalytics, // placeholder for analytics data
} from "@/data/mockData";

export const metadata: Metadata = {
  title: "Resource Library Management | FSP Admin",
  description: "Admin portal to organize, manage and distribute learning resources.",
};

export default function ResourceLibraryManagementPage() {
  // Overview stats (dummy numbers matching spec)
  const totalResources = 850;
  const pdfCount = 285;
  const videoCount = 145;
  const templateCount = 220;
  const downloads = 28450;
  const storageUsed = "125 GB";
  const featuredCount = 48;
  const privateCount = 120;

  return (
    <div className="space-y-10 py-8 px-4 md:px-8 lg:px-12">
      {/* PAGE HEADER */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-primary">Resource Library Management</h1>
        <p className="mt-2 text-lg text-slate-600">
          Organize, manage and distribute learning resources, templates and training materials for FSP members.
        </p>
      </section>

      {/* TOP ACTION BAR */}
      <section className="flex flex-col md:flex-row items-center gap-4">
        <Input placeholder="Search Resource..." className="flex-1" />
        <Select>
          <option>Category</option>
          {mockResourceCategories.map((c) => (
            <option key={c.id}>{c.title}</option>
          ))}
        </Select>
        <Select>
          <option>File Type</option>
          <option>PDF</option>
          <option>Video</option>
          <option>Canva</option>
          <option>Audio</option>
        </Select>
        <Select>
          <option>Access Level</option>
          {mockAccessControls.map((a) => (
            <option key={a.level}>{a.level}</option>
          ))}
        </Select>
        <Select>
          <option>Trainer</option>
          <option>Karunai Prakash</option>
          <option>Anand Sharma</option>
          <option>Priya Nair</option>
        </Select>
        <Select>
          <option>Upload Date</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </Select>
        <div className="flex gap-2">
          <Button variant="primary" asChild>
            <a href="#" className="flex items-center"><Plus className="mr-1" size={16} />Upload Resource</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center"><Folder className="mr-1" size={16} />Create Folder</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="#" className="flex items-center"><Upload className="mr-1" size={16} />Import Resources</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#" className="flex items-center"><Download className="mr-1" size={16} />Export Library Report</a>
          </Button>
        </div>
      </section>

      {/* SECTION 1 – OVERVIEW CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard title="Total Resources" value={totalResources} color="blue" />
        <StatCard title="PDF Files" value={pdfCount} color="orange" />
        <StatCard title="Videos" value={videoCount} color="green" />
        <StatCard title="Templates" value={templateCount} color="purple" />
        <StatCard title="Downloads" value={downloads} color="teal" />
        <StatCard title="Storage Used" value={storageUsed} color="red" />
        <StatCard title="Featured Resources" value={featuredCount} color="yellow" />
        <StatCard title="Private Resources" value={privateCount} color="gray" />
      </section>

      {/* SECTION 2 – RESOURCE CATEGORIES */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Resource Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mockResourceCategories.map((cat) => (
            <Card key={cat.id} className="p-4 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium truncate">{cat.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 3 – RESOURCE TABLE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Resources</h2>
        <Table
          columns={[
            { header: "Preview", accessor: "preview" },
            { header: "Resource Name", accessor: "name" },
            { header: "Category", accessor: "category" },
            { header: "File Type", accessor: "fileType" },
            { header: "Size", accessor: "size" },
            { header: "Uploaded By", accessor: "uploadedBy" },
            { header: "Access Level", accessor: "accessLevel" },
            { header: "Downloads", accessor: "downloads" },
            { header: "Status", accessor: "status" },
            { header: "Actions", accessor: "actions", render: (row) => (
                <div className="flex space-x-1">
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><FileText className="mr-1" size={12} />View</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Settings className="mr-1" size={12} />Edit</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Upload className="mr-1" size={12} />Replace</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Download className="mr-1" size={12} />Download</a>
                  </Button>
                  <Button variant="outline" size="xs" asChild>
                    <a href="#" className="flex items-center"><Trash2 className="mr-1" size={12} />Delete</a>
                  </Button>
                </div>
              ),
            },
          ]}
          data={mockResources.map((r) => ({
            preview: <div className="w-8 h-8 bg-slate-200 flex items-center justify-center text-xs">{r.fileType}</div>,
            name: r.name,
            category: r.category,
            fileType: r.fileType,
            size: r.size,
            uploadedBy: r.uploadedBy,
            accessLevel: r.accessLevel,
            downloads: r.downloads,
            status: r.status,
          }))}
        />
      </section>

      {/* SECTION 4 – FOLDER MANAGEMENT */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Folders</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mockResourceFolders.map((folder) => (
            <Card key={folder.id} className="p-4 hover:shadow-lg transition-shadow flex items-center space-x-2">
              <Folder className="text-primary" />
              <span>{folder.name}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 5 – FEATURED RESOURCES */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Featured Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mockFeaturedResources.map((feat) => (
            <Card key={feat.id} className="p-4 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium truncate">{feat.title}</CardTitle>
              </CardHeader>
              <div className="flex justify-between mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="#" className="flex items-center"><Star className="mr-1" size={14} />Feature</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#" className="flex items-center"><Settings className="mr-1" size={14} />Edit</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#" className="flex items-center"><Trash2 className="mr-1" size={14} />Remove</a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 6 – ACCESS CONTROL */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Member Access Control</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {mockAccessControls.map((ctrl) => (
            <Card key={ctrl.level} className="p-4 flex items-center justify-between">
              <span>{ctrl.level}</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 7 – DOWNLOAD ANALYTICS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Download Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <BarChart2 size={48} className="text-slate-500" />
            <span className="ml-2">Most Downloaded Resources</span>
          </Card>
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <Calendar size={48} className="text-slate-500" />
            <span className="ml-2">Downloads by Month</span>
          </Card>
          <Card className="h-48 flex items-center justify-center bg-slate-100">
            <PieChart size={48} className="text-slate-500" />
            <span className="ml-2">Downloads by Category</span>
          </Card>
        </div>
      </section>

      {/* SECTION 8 – RESOURCE VERSIONS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Resource Versions</h2>
        {/* Placeholder table - real data would be added later */}
        <Table
          columns={[
            { header: "Resource", accessor: "resource" },
            { header: "Current Version", accessor: "current" },
            { header: "Previous Version", accessor: "previous" },
            { header: "Updated Date", accessor: "date" },
            { header: "Status", accessor: "status" },
          ]}
          data={[]}
        />
      </section>

      {/* SECTION 9 – AI RESOURCE GENERATOR */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">AI Resource Generator</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Workbook</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Activity Sheet</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Reflection Questions</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Session Plan</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Proposal Template</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Canva Content</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Checklist</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="#" className="flex items-center justify-center"><Settings className="mr-1" size={16} />Generate Facilitation Notes</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 10 – QUICK ACTIONS */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          <Button variant="primary"><Upload className="mr-1" size={16} />Upload PDF</Button>
          <Button variant="primary"><Upload className="mr-1" size={16} />Upload Video</Button>
          <Button variant="primary"><Upload className="mr-1" size={16} />Upload Template</Button>
          <Button variant="primary"><Folder className="mr-1" size={16} />Create Folder</Button>
          <Button variant="primary"><Settings className="mr-1" size={16} />Manage Categories</Button>
          <Button variant="primary"><BarChart2 className="mr-1" size={16} />View Analytics</Button>
        </div>
      </section>

      {/* SECTION 11 – EMPTY STATE */}
      <section>
        <Card className="p-8 text-center">
          <p className="text-xl font-medium mb-4">No resources uploaded yet.</p>
          <Button variant="primary" asChild>
            <a href="#" className="flex items-center justify-center"><Plus className="mr-2" size={16} />Upload First Resource</a>
          </Button>
        </Card>
      </section>
    </div>
  );
}
