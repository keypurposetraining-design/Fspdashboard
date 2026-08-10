"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Plus, Edit, Trash2, Video, FileText, Link2, X, RefreshCcw, Search } from "lucide-react";

export default function AdminResources() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<any>("document");
  const [courseId, setCourseId] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [resourcesRes, coursesRes] = await Promise.all([
        supabase.from("resources").select("id, title, url, type, course_id, courses(title)"),
        supabase.from("courses").select("id, title")
      ]);

      if (resourcesRes.error) throw resourcesRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setResources(resourcesRes.data || []);
      setFilteredResources(resourcesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err: any) {
      console.error("Error loading resources data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = resources.filter(r => 
      (r.title || "").toLowerCase().includes(q) || 
      (r.courses?.title || "").toLowerCase().includes(q)
    );
    setFilteredResources(filtered);
  }, [searchQuery, resources]);

  // Simple URL Validation
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;  
    }
  };

  const handleCreateOrUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      alert("Please enter a valid absolute URL (e.g. https://domain.com/path)");
      return;
    }

    try {
      setLoading(true);
      if (selectedResource) {
        // Edit
        const { error } = await supabase
          .from("resources")
          .update({
            title,
            url,
            type,
            course_id: courseId,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedResource.id);

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "resource updated",
          table_name: "resources",
          record_id: selectedResource.id,
          performed_by: currentUser?.id,
          details: { title }
        });
      } else {
        // Create
        const resourceId = crypto.randomUUID();
        const { error } = await supabase
          .from("resources")
          .insert({
            id: resourceId,
            title,
            url,
            type,
            course_id: courseId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "resource created",
          table_name: "resources",
          record_id: resourceId,
          performed_by: currentUser?.id,
          details: { title }
        });
      }

      setIsResourceModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      alert("Error saving resource: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (res: any) => {
    setSelectedResource(res);
    setTitle(res.title || "");
    setUrl(res.url || "");
    setType(res.type);
    setCourseId(res.course_id || "");
    setIsResourceModalOpen(true);
  };

  const handleDelete = async (resId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "resource deleted",
        table_name: "resources",
        record_id: resId,
        performed_by: currentUser?.id,
        details: { resId }
      });

      await fetchInitialData();
    } catch (err: any) {
      alert("Error deleting resource: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resource Library</h1>
          <p className="text-sm text-slate-500 font-medium">Link training video recordings, PDFs, guides, and sheets to courses.</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedResource(null); setTitle(""); setUrl(""); setType("document"); setCourseId(""); setIsResourceModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Add Resource
        </Button>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search resource title or course..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading materials catalog...</div>
          ) : filteredResources.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No resources found.</div>
          ) : (
            <Table
              columns={[
                { header: "Type", accessor: "type", render: (row) => {
                  if (row.type === "video") return <Video className="w-4 h-4 text-[#FF7A00]" />;
                  if (row.type === "document") return <FileText className="w-4 h-4 text-[#0F4CFF]" />;
                  return <Link2 className="w-4 h-4 text-emerald-600" />;
                } },
                { header: "Resource Title", accessor: "title" },
                { header: "Associated Course", accessor: "course", render: (row) => row.courses?.title || "N/A" },
                { header: "Material URL", accessor: "url", render: (row) => (
                  <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-xs block font-medium">
                    {row.url}
                  </a>
                ) },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => handleOpenEdit(row)} icon={<Edit className="w-3 h-3" />}>
                      Edit
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => handleDelete(row.id)} className="border-rose-200 text-rose-600 hover:bg-rose-50" icon={<Trash2 className="w-3 h-3" />}>
                      Delete
                    </Button>
                  </div>
                ) }
              ]}
              data={filteredResources}
            />
          )}
        </CardContent>
      </Card>

      {/* RESOURCE DIALOG */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsResourceModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleCreateOrUpdateResource}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">{selectedResource ? "Edit Resource Material" : "Link New Resource"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="Material Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Design Thinking De-escalation Checklist"
                  required
                />
                <Input
                  label="Document/Stream/Hyperlink URL"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Material Format</label>
                  <Select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded p-2" required>
                    <option value="document">PDF / Document</option>
                    <option value="video">Streaming Video</option>
                    <option value="link">Hyperlink</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Link to Course</label>
                  <Select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full border rounded p-2" required>
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsResourceModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {selectedResource ? "Save Changes" : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
