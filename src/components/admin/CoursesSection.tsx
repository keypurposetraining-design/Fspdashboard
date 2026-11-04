"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Edit, Trash2, Eye, X, RefreshCcw } from "lucide-react";

export function CoursesSection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setLoading(true);
      // Fetch courses with enrollment counts
      const { data, error } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          description,
          created_at,
          course_enrollments (
            id
          )
        `);

      if (error) throw error;
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (err: any) {
      console.error("Error fetching courses:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = courses.filter(c =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
    setFilteredCourses(filtered);
  }, [searchQuery, courses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const courseId = crypto.randomUUID();
      const { error } = await supabase
        .from("courses")
        .insert({
          id: courseId,
          title,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "course created",
        table_name: "courses",
        record_id: courseId,
        performed_by: currentUser?.id,
        details: { title, description }
      });

      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
      await fetchCourses();
    } catch (err: any) {
      alert("Error creating course: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (course: any) => {
    setSelectedCourse(course);
    setTitle(course.title || "");
    setDescription(course.description || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("courses")
        .update({
          title,
          description,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedCourse.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "course updated",
        table_name: "courses",
        record_id: selectedCourse.id,
        performed_by: currentUser?.id,
        details: { title, description }
      });

      setIsEditModalOpen(false);
      setTitle("");
      setDescription("");
      await fetchCourses();
    } catch (err: any) {
      alert("Error updating course: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? All associated data might be affected.")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "course deleted",
        table_name: "courses",
        record_id: courseId,
        performed_by: currentUser?.id,
        details: { courseId }
      });

      await fetchCourses();
    } catch (err: any) {
      alert("Error deleting course: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">Courses</h1>
          <p className="text-sm text-slate-500 font-medium">Create, edit, and moderate facilitator training courses & curricula.</p>
        </div>
        <Button size="sm" onClick={() => { setIsCreateModalOpen(true); setTitle(""); setDescription(""); }} icon={<Plus className="w-4 h-4" />}>
          Add New Course
        </Button>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search course title or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchCourses} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No courses created yet.</div>
          ) : (
            <Table
              columns={[
                { header: "Course Title", accessor: "title" },
                { header: "Description", accessor: "description", render: (row) => <span className="truncate max-w-xs block">{row.description || "—"}</span> },
                { header: "Enrollments", accessor: "enrollment_count", render: (row) => row.course_enrollments?.length || 0 },
                { header: "Created Date", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleDateString() },
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
              data={filteredCourses}
            />
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsCreateModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleCreate}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Create Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="Course Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Interactive Design Thinking"
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Course Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide details about course modules..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsEditModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSaveEdit}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Edit Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="Course Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Course Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default CoursesSection;
