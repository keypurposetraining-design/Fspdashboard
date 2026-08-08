import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Filter, Search, FolderPlus, FileVideo2, Upload, Download, Mail } from "lucide-react";
import {
  mockCourses,
  mockModules,
  mockLessons,
  mockResources,
  mockAssignments,
  mockEnrollments,
  mockCourseSettings,
  mockAIBuilderOptions,
  mockCourseQuickActions,
} from "@/data/mockData";

export default function CourseLearningManagementPage() {
  const [resources, setResources] = useState(mockResources);

  const toggleResourceEnabled = (index) => {
    const newResources = [...resources];
    // Placeholder for toggle logic
    setResources(newResources);
  };

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">Course &amp; Learning Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create, manage and monitor all FSP learning programs from one place.
        </p>
      </section>

      {/* Top Action Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search Course" className="max-w-sm" />
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
            <span className="flex items-center"><Plus className="w-4 h-4 mr-1" />Create New Course</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><FolderPlus className="w-4 h-4 mr-1" />Create Module</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><FileVideo2 className="w-4 h-4 mr-1" />Upload Video</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Upload className="w-4 h-4 mr-1" />Upload PDF</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Download className="w-4 h-4 mr-1" />Import Course</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Mail className="w-4 h-4 mr-1" />Export Report</span>
          </Button>
        </div>
      </section>

      {/* Section 1 – Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={mockCourses.length.toString()} />
        <StatCard title="Active Courses" value={mockCourses.filter(c => c.status === "Active").length.toString()} />
        <StatCard title="Draft Courses" value={mockCourses.filter(c => c.status === "Draft").length.toString()} />
        <StatCard title="Students Enrolled" value="1,248" />
        <StatCard title="Course Completion" value="84%" />
        <StatCard title="Videos Uploaded" value="265" />
        <StatCard title="Resources" value="520" />
        <StatCard title="Certificates Linked" value="18" />
      </section>

      {/* Section 2 – Course Library */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Course Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCourses.map((course) => (
            <Card key={course.id} className="p-4 flex flex-col">
              <img src={course.thumbnail} alt={course.name} className="w-full h-40 object-cover rounded-md mb-3" />
              <h3 className="text-lg font-medium mb-1">{course.name}</h3>
              <p className="text-sm text-muted-foreground"><strong>Trainer:</strong> {course.trainer}</p>
              <p className="text-sm text-muted-foreground"><strong>Duration:</strong> {course.duration}</p>
              <p className="text-sm text-muted-foreground"><strong>Modules:</strong> {course.modules}</p>
              <p className="text-sm text-muted-foreground"><strong>Students:</strong> {course.students}</p>
              <p className="text-sm text-muted-foreground"><strong>Rating:</strong> {course.rating} ★</p>
              <p className="text-sm text-muted-foreground"><strong>Status:</strong> {course.status}</p>
              <div className="mt-3 flex space-x-2">
                <Button variant="outline" size="sm" asChild><span>View</span></Button>
                <Button variant="outline" size="sm" asChild><span>Edit</span></Button>
                <Button variant="outline" size="sm" asChild><span>Duplicate</span></Button>
                <Button variant="outline" size="sm" asChild><span>Archive</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 – Course Structure */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Course Structure</h2>
        <div className="space-y-2">
          {mockCourses.map((course) => (
            <div key={course.id} className="border rounded-md p-3">
              <p className="font-medium mb-1">{course.name}</p>
              <ul className="ml-4 list-disc">
                {mockModules[course.id]?.map((mod) => (
                  <li key={mod.id}>
                    {mod.name}
                    <ul className="ml-4 list-disc">
                      {mockLessons[mod.id]?.map((les) => (
                        <li key={les.id}>{les.title} ({les.duration})</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 – Lesson Details */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Lesson Details</h2>
        {Object.entries(mockLessons).map(([modId, lessons]) => (
          <div key={modId} className="space-y-2 mb-4">
            <h3 className="font-medium">{modId}</h3>
            {lessons.map((les) => (
              <Card key={les.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-10 bg-gray-200 rounded"></div>
                  <div>
                    <p className="font-medium">{les.title}</p>
                    <p className="text-sm text-muted-foreground">Duration: {les.duration}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" asChild><span>Edit</span></Button>
                  <Button variant="ghost" size="sm" asChild><span>Preview</span></Button>
                  <Button variant="ghost" size="sm" asChild><span>Replace Video</span></Button>
                  <Button variant="ghost" size="sm" asChild><span>Delete</span></Button>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </section>

      {/* Section 5 – Resource Manager */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Resource Manager</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockResources.map((res) => (
            <Card key={res.id} className="p-4 flex flex-col">
              <p className="font-medium">{res.name}</p>
              <p className="text-sm text-muted-foreground">Category: {res.category}</p>
              <p className="text-sm text-muted-foreground">Downloads: {res.downloads}</p>
              <p className="text-sm text-muted-foreground">Linked Course: {res.linkedCourse}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Assignment Manager */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Assignment Manager</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockAssignments.map((asg) => (
            <Card key={asg.id} className="p-4 flex flex-col">
              <p className="font-medium">{asg.name}</p>
              <p className="text-sm text-muted-foreground">Linked Module: {asg.linkedModule}</p>
              <p className="text-sm text-muted-foreground">Due: {asg.dueDate}</p>
              <p className="text-sm text-muted-foreground">Status: {asg.status}</p>
              <p className="text-sm text-muted-foreground">Max Score: {asg.maxScore}</p>
              <div className="mt-2 flex space-x-2">
                <Button variant="ghost" size="sm" asChild><span>Edit</span></Button>
                <Button variant="ghost" size="sm" asChild><span>View</span></Button>
                <Button variant="ghost" size="sm" asChild><span>Duplicate</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 – Learning Progress */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Learning Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="h-64 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">Course Completion (Chart Placeholder)</span>
          </Card>
          <Card className="h-64 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">Module Completion (Chart Placeholder)</span>
          </Card>
          <Card className="h-64 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">Student Progress (Chart Placeholder)</span>
          </Card>
          <Card className="h-64 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">Most Popular Courses (Chart Placeholder)</span>
          </Card>
        </div>
      </section>

      {/* Section 8 – Enrollment Management */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Enrollment Management</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Course</th>
                <th className="p-3">Enrollment Date</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Completion</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockEnrollments.map((en, i) => (
                <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">{en.member}</td>
                  <td className="p-3">{en.course}</td>
                  <td className="p-3">{en.enrollmentDate}</td>
                  <td className="p-3">{en.progress}</td>
                  <td className="p-3">{en.completion}</td>
                  <td className="p-3"><Badge>{en.status}</Badge></td>
                  <td className="p-3 flex space-x-1">
                    <Button variant="ghost" size="sm" asChild><span>Assign Course</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Remove Course</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Reset Progress</span></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 9 – Course Settings */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Course Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCourseSettings.map((setting, i) => (
            <Card key={i} className="p-4">
              <p className="font-medium mb-1">{setting.title}</p>
              <p className="text-sm text-muted-foreground">{setting.value}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 10 – AI Course Builder */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">AI Course Builder</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAIBuilderOptions.map((opt, i) => (
            <Card key={i} className="p-4 flex flex-col items-center">
              <span className="text-3xl mb-2 text-primary">{opt.icon}</span>
              <p className="font-medium">{opt.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 11 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mockCourseQuickActions.map((action, i) => (
            <Card key={i} className="p-4 flex flex-col items-center hover:shadow-lg transition-shadow">
              <Button variant="ghost" size="lg" asChild>
                <span className="flex flex-col items-center">
                  <span className="text-3xl mb-2 text-primary">{action.icon}</span>
                  {action.label}
                </span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 12 – Empty State */}
      {mockCourses.length === 0 && (
        <section className="text-center py-12">
          <p className="text-xl mb-4">No courses created yet.</p>
          <Button size="lg" asChild>
            <span className="flex items-center"><Plus className="w-5 h-5 mr-2" />Create First Course</span>
          </Button>
        </section>
      )}
    </main>
  );
}
