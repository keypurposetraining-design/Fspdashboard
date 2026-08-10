"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, CheckCircle, RefreshCcw, Bookmark } from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const CoursesView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [member, setMember] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  async function fetchInitialData() {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch member
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (memberData) {
        setMember(memberData);

        // Fetch courses
        const { data: coursesData, error: coursesErr } = await supabase
          .from("courses")
          .select("*");
        if (coursesErr) throw coursesErr;
        setCourses(coursesData || []);

        // Fetch enrollments
        const { data: enrollData, error: enrollErr } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("member_id", memberData.id);
        if (enrollErr) throw enrollErr;
        setEnrollments(enrollData || []);

        await logMemberActivity("COURSE_VIEW");
      }
    } catch (err: any) {
      console.error("Error loading courses data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!member) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          member_id: member.id,
          enrolled_at: new Date().toISOString(),
          status: "active"
        });

      if (error) throw error;
      await logMemberActivity("COURSE_ENROLL", { course_id: courseId });
      await fetchInitialData();
      alert("Successfully enrolled in course!");
    } catch (err: any) {
      alert("Enrollment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              FSP CURRICULUM CATALOG
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Courses &amp; Programs
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse facilitation training programs, enroll in courses, and monitor your learning journey.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">Loading catalog courses...</div>
      ) : courses.length === 0 ? (
        <div className="py-12 text-center text-slate-500 border border-dashed rounded-3xl bg-white">
          No courses are currently available in the curriculum database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);

            return (
              <Card key={course.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F4CFF] to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    {enrolled ? (
                      <Badge variant="success" size="sm" dot>
                        Enrolled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        Available
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-3">
                      {course.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                  {enrolled ? (
                    <Button variant="soft" size="sm" fullWidth disabled icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}>
                      Enrolled &amp; Active
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" fullWidth onClick={() => handleEnroll(course.id)} icon={<BookOpen className="w-4 h-4" />}>
                      Enroll in Course
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
