"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Upload,
  Download,
  X
} from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const TasksView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [member, setMember] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Submissions Modal State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  async function fetchInitialData() {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch member profile
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (memberData) {
        setMember(memberData);

        // Fetch all tasks
        const { data: tasksData, error: tasksErr } = await supabase
          .from("tasks")
          .select("*, courses(title)");
        if (tasksErr) throw tasksErr;
        setTasks(tasksData || []);

        // Fetch user submissions
        const { data: subsData, error: subsErr } = await supabase
          .from("task_submissions")
          .select("*")
          .eq("member_id", memberData.id);
        if (subsErr) throw subsErr;
        setSubmissions(subsData || []);

        await logMemberActivity("TASK_VIEW");
      }
    } catch (err: any) {
      console.error("Error fetching tasks/submissions:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Sanitize Filename
  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      // Validate Size (5MB)
      if (selected.size > 5 * 1024 * 1024) {
        alert("Maximum allowed file size is 5MB.");
        return;
      }

      // Validate Allowed Types
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/jpg"
      ];
      if (!allowedTypes.includes(selected.type)) {
        alert("Unsupported file type! Please upload a PDF, Word Doc, or PNG/JPG image.");
        return;
      }

      setFile(selected);
      setUploadStatus("File selected successfully.");
    }
  };

  // Handle Upload Submission
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !selectedTask || !file || !user) return;

    try {
      setSubmitting(true);
      setUploadStatus("Uploading file to secure storage...");

      const sanitized = sanitizeFilename(file.name);
      const storagePath = `${user.id}/${selectedTask.id}/${Date.now()}_${sanitized}`;

      // Upload to Supabase Storage
      const { data, error: uploadErr } = await supabase.storage
        .from("task-submissions")
        .upload(storagePath, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) throw uploadErr;

      setUploadStatus("Recording submission...");

      // Check if submission record already exists for resubmission update
      const existingSub = submissions.find(s => s.task_id === selectedTask.id);
      if (existingSub) {
        // Update existing pending submission
        const { error: updateErr } = await supabase
          .from("task_submissions")
          .update({
            file_url: storagePath,
            submitted_at: new Date().toISOString()
          })
          .eq("id", existingSub.id);

        if (updateErr) throw updateErr;
        await logMemberActivity("TASK_RESUBMISSION", { task_id: selectedTask.id });
      } else {
        // Insert new submission
        const { error: insertErr } = await supabase
          .from("task_submissions")
          .insert({
            task_id: selectedTask.id,
            member_id: member.id,
            file_url: storagePath,
            submitted_at: new Date().toISOString()
          });

        if (insertErr) throw insertErr;
        await logMemberActivity("TASK_SUBMISSION", { task_id: selectedTask.id });
      }

      setIsSubmitModalOpen(false);
      setFile(null);
      setUploadStatus("");
      await fetchInitialData();
      alert("Syllabus assignment uploaded and submitted successfully!");
    } catch (err: any) {
      alert("Upload failed: " + err.message);
      setUploadStatus("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Download Submission File dynamically via Signed URL
  const handleDownloadFile = async (filePath: string) => {
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

  // Helper to check submission status
  const getTaskStatus = (taskId: string) => {
    const sub = submissions.find(s => s.task_id === taskId);
    if (!sub) return { status: "Pending", grade: null, record: null };
    if (sub.grade !== null && sub.grade !== undefined) return { status: "Graded", grade: sub.grade, record: sub };
    return { status: "Submitted", grade: null, record: sub };
  };

  const completedCount = submissions.filter(s => s.grade !== null).length;
  const submittedCount = submissions.filter(s => s.grade === null).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-200 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              GAMIFIED LEARNING HUB
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tasks &amp; Challenges
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete your coursework activities, upload deliverables, and track evaluation grades.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverEffect className="flex flex-col justify-between border-slate-200/90">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Completed Tasks
              </span>
              <span className="text-3xl font-black text-slate-900">{completedCount}</span>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">✓ Officially Graded</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card hoverEffect className="flex flex-col justify-between border-slate-200/90">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Awaiting Grading
              </span>
              <span className="text-3xl font-black text-slate-900">{submittedCount}</span>
              <p className="text-[11px] text-amber-600 font-bold mt-0.5">Pending evaluation review</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card hoverEffect className="flex flex-col justify-between border-slate-200/90">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Tasks Configured
              </span>
              <span className="text-3xl font-black text-slate-900">{tasks.length}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Active curriculum modules</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-primary border border-blue-100">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* TASKS LIST */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Curriculum Assignments</h2>
          <p className="text-xs text-slate-500">Submit deliverables for active training program levels.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium">Loading syllabus tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed rounded-3xl bg-white">
            No active syllabus tasks found in your courses.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const { status, grade, record } = getTaskStatus(task.id);

              return (
                <Card key={task.id} className="flex flex-col justify-between space-y-4 p-5 bg-white border border-slate-200">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="primary" size="sm">
                          {task.courses?.title || "Curriculum Course"}
                        </Badge>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight mt-2">
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">
                          {task.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant={status === "Graded" ? "success" : status === "Submitted" ? "primary" : "warning"} size="sm">
                        {status}
                      </Badge>
                    </div>

                    {status === "Graded" && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs text-emerald-800">
                        <span>Evaluation Score:</span>
                        <span className="font-black text-sm">{grade}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    {status === "Pending" ? (
                      <Button variant="primary" size="sm" fullWidth onClick={() => { setSelectedTask(task); setIsSubmitModalOpen(true); }} icon={<Upload className="w-3.5 h-3.5" />}>
                        Upload Proof Submission
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" size="sm" fullWidth onClick={() => handleDownloadFile(record.file_url)} icon={<Download className="w-3.5 h-3.5" />}>
                          View Uploaded File
                        </Button>
                        {status === "Submitted" && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(task); setIsSubmitModalOpen(true); }}>
                            Resubmit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SUBMIT DIALOG */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <Card className="w-full max-w-md bg-white p-6 shadow-xl relative rounded-3xl">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsSubmitModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSubmitTask}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-lg font-bold">Submit Assignment File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Upload your workbook, report PDF, or visual templates (Max 5MB). Allowed formats: PDF, DOC, DOCX, PNG, JPG.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Select File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0F4CFF] hover:file:bg-blue-100 cursor-pointer"
                    required
                  />
                  {uploadStatus && (
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      {uploadStatus}
                    </span>
                  )}
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting || !file}>
                  {submitting ? "Uploading..." : "Submit File"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
