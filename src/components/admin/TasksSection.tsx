"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Plus, Edit, Trash2, CheckCircle2, Download, X, RefreshCcw } from "lucide-react";

export function TasksSection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Task creation/edit states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskCourseId, setTaskCourseId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Grading states
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState("");

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
      const [tasksRes, submissionsRes, coursesRes] = await Promise.all([
        supabase.from("tasks").select("id, title, description, due_date, course_id, courses(title)"),
        supabase.from("task_submissions").select("id, submitted_at, grade, file_url, tasks(title), members(first_name, last_name)"),
        supabase.from("courses").select("id, title")
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (submissionsRes.error) throw submissionsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setTasks(tasksRes.data || []);
      setSubmissions(submissionsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err: any) {
      console.error("Error loading task/grading data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAdminDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("task-submissions")
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (err: any) {
      alert("Failed to retrieve file download link: " + err.message);
    }
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedTask) {
        // Edit
        const { error } = await supabase
          .from("tasks")
          .update({
            title: taskTitle,
            description: taskDesc,
            course_id: taskCourseId || null,
            due_date: taskDueDate || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedTask.id);

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "task updated",
          table_name: "tasks",
          record_id: selectedTask.id,
          performed_by: currentUser?.id,
          details: { title: taskTitle }
        });
      } else {
        // Create
        const taskId = crypto.randomUUID();
        const { error } = await supabase
          .from("tasks")
          .insert({
            id: taskId,
            title: taskTitle,
            description: taskDesc,
            course_id: taskCourseId || null,
            due_date: taskDueDate || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "task created",
          table_name: "tasks",
          record_id: taskId,
          performed_by: currentUser?.id,
          details: { title: taskTitle }
        });
      }

      setIsTaskModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      alert("Error saving task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditTask = (task: any) => {
    setSelectedTask(task);
    setTaskTitle(task.title || "");
    setTaskDesc(task.description || "");
    setTaskCourseId(task.course_id || "");
    setTaskDueDate(task.due_date || "");
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "task deleted",
        table_name: "tasks",
        record_id: taskId,
        performed_by: currentUser?.id,
        details: { taskId }
      });

      await fetchInitialData();
    } catch (err: any) {
      alert("Error deleting task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGrading = (sub: any) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade !== null ? String(sub.grade) : "");
    setIsGradingModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("task_submissions")
        .update({
          grade: grade ? Number(grade) : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "submission graded",
        table_name: "task_submissions",
        record_id: selectedSubmission.id,
        performed_by: currentUser?.id,
        details: { grade: grade ? Number(grade) : null }
      });

      setIsGradingModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      alert("Error grading submission: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">Tasks & Submissions</h1>
          <p className="text-sm text-slate-500 font-medium">Create learning tasks and evaluate student work submissions.</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedTask(null); setTaskTitle(""); setTaskDesc(""); setTaskCourseId(""); setTaskDueDate(""); setIsTaskModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Add New Task
        </Button>
      </div>

      {/* TABS FOR TASKS & SUBMISSIONS */}
      <Tabs>
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" onClick={fetchInitialData}>Tasks & Challenges</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Tasks List */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Configured Tasks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-6 text-center text-slate-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="py-6 text-center text-slate-500">No tasks created yet.</div>
                ) : (
                  <Table
                    columns={[
                      { header: "Task Title", accessor: "title" },
                      { header: "Associated Course", accessor: "course", render: (row) => row.courses?.title || "None" },
                      { header: "Due Date", accessor: "due_date", render: (row) => row.due_date || "—" },
                      { header: "Actions", accessor: "actions", render: (row) => (
                        <div className="flex gap-2">
                          <Button variant="outline" size="xs" onClick={() => handleOpenEditTask(row)} icon={<Edit className="w-3 h-3" />}>
                            Edit
                          </Button>
                          <Button variant="outline" size="xs" onClick={() => handleDeleteTask(row.id)} className="border-rose-200 text-rose-600 hover:bg-rose-50" icon={<Trash2 className="w-3 h-3" />}>
                            Delete
                          </Button>
                        </div>
                      ) }
                    ]}
                    data={tasks}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submissions Grading */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Submissions Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-6 text-center text-slate-500">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="py-6 text-center text-slate-500">No submissions uploaded.</div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{sub.members ? `${sub.members.first_name || ""} ${sub.members.last_name || ""}` : "N/A"}</h4>
                            <p className="text-xs text-slate-500">Task: {sub.tasks?.title || "—"}</p>
                          </div>
                          {sub.grade !== null ? (
                            <Badge variant="success">Graded: {sub.grade}</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                         <div className="flex gap-2 pt-1">
                          {sub.file_url && (
                            <Button variant="outline" size="xs" onClick={() => handleAdminDownload(sub.file_url)} icon={<Download className="w-3 h-3" />}>
                              View Attachment
                            </Button>
                          )}
                          <Button variant="outline" size="xs" onClick={() => handleOpenGrading(sub)} icon={<CheckCircle2 className="w-3 h-3" />}>
                            {sub.grade !== null ? "Re-grade" : "Evaluate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

      {/* TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsTaskModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleCreateOrUpdateTask}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">{selectedTask ? "Edit Task" : "Create Task"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="Task Title"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. De-escalation simulation record"
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Description / Instructions</label>
                  <textarea
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    placeholder="Provide details about expected upload file, criteria, and steps..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 font-semibold block">Associate to Course</label>
                  <Select value={taskCourseId} onChange={e => setTaskCourseId(e.target.value)} className="w-full border rounded p-2">
                    <option value="">No Course (General Challenge)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Due Date"
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                />
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {selectedTask ? "Save Changes" : "Create Task"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* GRADING MODAL */}
      {isGradingModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsGradingModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSaveGrade}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Grade Task Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Student</span>
                  <span className="text-sm font-medium text-slate-900">{selectedSubmission.members ? `${selectedSubmission.members.first_name || ""} ${selectedSubmission.members.last_name || ""}` : "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Task Title</span>
                  <span className="text-sm font-medium text-slate-900">{selectedSubmission.tasks?.title || "—"}</span>
                </div>
                {selectedSubmission.file_url && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Submission Attachment</span>
                    <button
                      type="button"
                      onClick={() => handleAdminDownload(selectedSubmission.file_url)}
                      className="text-sm text-[var(--brand-navy)] hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                    >
                      <Download size={14} /> Open uploaded work
                    </button>
                  </div>
                )}
                <Input
                  label="Enter Grade (0 - 100)"
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="e.g. 85"
                  required
                />
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsGradingModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Saving..." : "Submit Grade"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TasksSection;
