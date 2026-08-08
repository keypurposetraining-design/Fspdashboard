import React from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Sun,
  Moon,
  Monitor,
  User,
  Settings,
  ShieldCheck,
  Mail,
  Phone,
  MessageSquare,
  Lock,
  CheckCircle2,
  BadgeCheck,
  Pencil,
  Save,
  Download,
  Camera,
  Calendar,
  ChevronRight,
  Flag,
  Users,
  FileText,
  HelpCircle,
  Ticket,
  MailCheck,
  PhoneCheck,
  Tv,
  Palette,
} from "lucide-react";
import { mockUser, mockNotifications, mockAnnouncements, mockRemindersTimeline } from "@/data/mockData";

// Dummy skill list – could be extended later
const initialSkills = [
  "Leadership",
  "Facilitation",
  "Team Building",
  "OBT",
  "Communication",
  "Sales Training",
  "Time Management",
  "NLP",
];

export default function ProfilePage() {
  const [skills, setSkills] = React.useState(initialSkills);

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) setSkills([...skills, skill]);
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Placeholder toggle component – simple button with sliding circle
  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (v: boolean) => void }> = ({ enabled, onChange }) => (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">My Profile &amp; Settings</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your personal information, professional profile, account preferences, and security.
        </p>
      </section>

      {/* SECTION 1 – Profile Overview */}
      <section>
        <Card className="p-6 flex items-center space-x-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback>{mockUser.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-primary">{mockUser.name}</h2>
            <p className="text-sm text-muted-foreground">{mockUser.tier}</p>
            <p className="text-sm">Member ID: <span className="font-medium">{mockUser.id}</span></p>
            <p className="text-sm">{mockUser.location}</p>
            <p className="text-sm">Experience: <span className="font-medium">10 Years</span></p>
            <p className="text-sm">Training Programs: <span className="font-medium">500+</span></p>
            <p className="text-sm text-success">Status: Active Member</p>
            <div className="mt-4 flex space-x-3">
              <Button variant="outline" size="sm" asChild>
                <a href="#">Edit Profile</a>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <a href="#">Share Profile</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#">Download Digital Membership Card</a>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 2 – Personal Information */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" defaultValue={mockUser.name} />
          <Input label="Email" defaultValue={mockUser.email} />
          <Input label="Mobile" defaultValue="+91 98765 43210" />
          <Input label="Date of Birth" defaultValue="1990-04-15" type="date" />
          <Input label="Gender" defaultValue="Female" />
          <Input label="City" defaultValue={mockUser.location.split(",")[0].trim()} />
          <Input label="State" defaultValue="Tamil Nadu" />
          <Input label="Country" defaultValue="India" />
          <Input label="Language" defaultValue="English" />
        </Card>
      </section>

      {/* SECTION 3 – Professional Profile */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Professional Profile</h2>
        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company" defaultValue="Acme Corp" />
          <Input label="Designation" defaultValue="Senior Facilitator" />
          <Input label="Years of Experience" defaultValue="10" />
          <Input label="Training Expertise" defaultValue="Agile Coaching, Design Thinking" />
          <Input label="Industries Served" defaultValue="Tech, Finance, Healthcare" />
          <Input label="LinkedIn Profile" defaultValue="https://linkedin.com/in/karunai" />
          <Input label="Website" defaultValue="https://karunaiportfolio.com" />
          <Input label="Instagram" defaultValue="@karunai_fsp" />
          <Input label="YouTube" defaultValue="Karunai Sessions" />
          <Input label="Short Bio" defaultValue={mockUser.bio} />
        </Card>
      </section>

      {/* SECTION 4 – Trainer Portfolio */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Trainer Portfolio</h2>
        <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Programs Conducted" value="120" />
          <StatCard title="Participants Trained" value="3500+" />
          <StatCard title="Corporate Clients" value="35" />
          <StatCard title="Countries Served" value="12" />
          <StatCard title="Certificates Earned" value="8" />
          <div className="flex items-center justify-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <a href="#">View Portfolio</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#">Download Portfolio</a>
            </Button>
          </div>
        </Card>
      </section>

      {/* SECTION 5 – Skills & Expertise */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Skills &amp; Expertise</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill) => (
              <Badge key={skill} variant="primary" className="flex items-center space-x-1">
                <span>{skill}</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-xs hover:text-red-500 focus:outline-none"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          {/* Simple UI to add a skill – not functional beyond UI */}
          <div className="flex items-center space-x-2">
            <Input placeholder="Add a skill" className="flex-1" />
            <Button size="sm" onClick={() => { /* placeholder */ }}>
              Add
            </Button>
          </div>
        </Card>
      </section>

      {/* SECTION 6 – Notification Preferences */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Notification Preferences</h2>
        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "WhatsApp", icon: MessageSquare },
            { label: "Email", icon: Mail },
            { label: "SMS", icon: Phone },
            { label: "Push Notifications", icon: BellRing },
            { label: "Community Updates", icon: Users },
            { label: "Event Reminders", icon: Calendar },
            { label: "Challenge Reminders", icon: Flag },
            { label: "Course Updates", icon: Book },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <pref.icon className="w-5 h-5 text-primary" />
                <span>{pref.label}</span>
              </div>
              <ToggleSwitch enabled={true} onChange={() => {}} />
            </div>
          ))}
        </Card>
      </section>

      {/* SECTION 7 – Privacy & Security */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Privacy &amp; Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Change Password", icon: Lock, action: "#" },
            { title: "Enable Two-Factor Authentication", icon: ShieldCheck, action: "#" },
            { title: "Manage Login Devices", icon: Monitor, action: "#" },
            { title: "Privacy Settings", icon: Settings, action: "#" },
          ].map((item) => (
            <Card key={item.title} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.title}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={item.action}>Manage</a>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 8 – Appearance */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Appearance</h2>
        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant={"outline"} asChild>
              <a href="#">Light Mode</a>
            </Button>
            <Button variant={"outline"} asChild>
              <a href="#">Dark Mode</a>
            </Button>
            <Button variant={"outline"} asChild>
              <a href="#">System Default</a>
            </Button>
          </div>
          {/* Theme preview placeholder */}
          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
            Theme preview (placeholder)
          </div>
        </Card>
      </section>

      {/* SECTION 9 – Support & Help */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Support &amp; Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Raise Support Ticket", icon: Ticket, action: "#" },
            { title: "WhatsApp Support", icon: MessageSquare, action: "#" },
            { title: "Email Support", icon: Mail, action: "#" },
            { title: "FAQs", icon: HelpCircle, action: "#" },
            { title: "User Guide", icon: FileText, action: "#" },
            { title: "Contact FSP Team", icon: PhoneCheck, action: "#" },
          ].map((item) => (
            <Card key={item.title} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.title}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={item.action}>Open</a>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 10 – Achievements Snapshot */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Achievements Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Courses Completed" value={String(mockUser.stats.completedCourses)} />
          <StatCard title="Certificates" value={String(mockUser.stats.certificatesEarned)} />
          <StatCard title="Events Attended" value={String(mockUser.stats.eventsAttended)} />
          <StatCard title="Challenges Completed" value={String(mockUser.stats.activeChallenges)} />
          <StatCard title="Community Rank" value={mockUser.stats.communityRank} />
        </div>
      </section>

      {/* SECTION 11 – Account Settings */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Download My Data", icon: Download, action: "#" },
            { title: "Delete Account", icon: Trash2, disabled: true, action: "#" },
            { title: "Terms & Conditions", icon: FileText, action: "#" },
            { title: "Privacy Policy", icon: ShieldCheck, action: "#" },
            { title: "Logout", icon: LogOut, action: "#" },
          ].map((item) => (
            <Card key={item.title} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.title}</span>
              </div>
              <Button
                variant={item.disabled ? "secondary" : "outline"}
                size="sm"
                disabled={item.disabled}
                asChild
              >
                <a href={item.action}>{item.disabled ? "Disabled" : "Open"}</a>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 12 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Update Profile", icon: Pencil },
            { label: "Change Password", icon: Lock },
            { label: "Download Membership Card", icon: Download },
            { label: "View Certificates", icon: BadgeCheck },
            { label: "Contact Support", icon: HelpCircle },
          ].map((action) => (
            <Card key={action.label} className="p-6 flex flex-col items-center hover:shadow-lg transition-shadow text-center">
              <action.icon className="w-8 h-8 mb-2 text-primary" />
              <span className="font-medium">{action.label}</span>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
