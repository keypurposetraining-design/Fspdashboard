export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  tier: string;
  memberSince: string;
  startDate: string;
  expiryDate: string;
  remainingDays: number;
  location: string;
  bio: string;
  credits: number;
  stats: {
    completedCourses: number;
    availableCourses: number;
    completedModules: number;
    totalModules: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
    activeChallenges: number;
    certificatesEarned: number;
    communityRank: string;
    hoursFacilitated: number;
    resourcesDownloaded: number;
    eventsAttended: number;
    communityParticipation: number;
    currentStreakDays: number;
    overallProgressPct: number;
  };
  skills: string[];
}

export interface TaskCategoryItem {
  id: string;
  title: string;
  description?: string;
  category: "Learning" | "Marketing" | "Practice" | "Reading" | "Community" | "Certification";
  priority: "High" | "Medium" | "Low";
  dueDate?: string;
  status: "Pending" | "In Progress" | "Upcoming" | "Completed";
  points?: number;
}

export interface AchievementBadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface LeaderboardMemberItem {
  rank: number;
  name: string;
  points: number;
  avatar: string;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface TaskHistoryItem {
  id: string;
  taskName: string;
  completedDate: string;
  status: string;
  pointsEarned: string;
}

export interface ReminderItem {
  id: string;
  date: string;
  title: string;
  category: string;
}

export interface LearningLevelItem {
  level: string;
  title: string;
  fee: string;
  status: "Paid" | "Pending" | "Locked";
  action: "Completed" | "Pay Now" | "Unavailable";
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  invoiceUrl: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  points?: number;
  dueDate?: string;
  status: "pending" | "in-progress" | "upcoming" | "completed" | "locked";
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: string;
  speaker?: {
    name: string;
    role: string;
    avatar: string;
  };
  type?: string;
  attendeesCount?: number;
  isRSVPed?: boolean;
  zoomUrl?: string;
  recordingUrl?: string;
  actionText?: string;
  status?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  downloadUrl: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  credentialId: string;
  issueDate: string;
  expiryDate: string;
  category: string;
  skillsVerified: string[];
  certificateUrl: string;
  badgeIcon: string;
}

export interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    tier: string;
    role: string;
  };
  title: string;
  content: string;
  category: string;
  upvotes: number;
  commentsCount: number;
  postedAt: string;
  isLiked?: boolean;
  tags: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "event" | "task" | "community" | "system" | "billing";
  isRead: boolean;
  actionUrl?: string;
}

export interface ChallengeItem {
  id: string;
  title: string;
  subtitle?: string;
  currentDays: number;
  totalDays: number;
  month?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "resource" | "course" | "billing" | "general";
  isNew?: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  icon: string;
}

export const mockUser: UserProfile = {
  id: "FSP000145",
  name: "Karunai",
  email: "karunai@facilitators.org",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
  role: "Certified Lead Facilitator",
  tier: "FSP Annual Membership",
  memberSince: "01 August 2024",
  startDate: "01 August 2026",
  expiryDate: "31 July 2027",
  remainingDays: 360,
  location: "Chennai, India",
  bio: "Passionate group facilitator and learning designer empowering corporate teams through interactive workshops and agile coaching.",
  credits: 420,
  stats: {
    completedCourses: 6,
    availableCourses: 18,
    completedModules: 18,
    totalModules: 24,
    pendingTasks: 5,
    completedTasks: 18,
    overdueTasks: 1,
    activeChallenges: 2,
    certificatesEarned: 2,
    communityRank: "Top 3 Facilitator",
    hoursFacilitated: 156,
    resourcesDownloaded: 24,
    eventsAttended: 12,
    communityParticipation: 85,
    currentStreakDays: 12,
    overallProgressPct: 72,
  },
  skills: [
    "Interactive Facilitation",
    "Agile Coaching",
    "Design Sprints",
    "Conflict Resolution",
    "Miro & Mural Mastery"
  ]
};

export const mockCategorizedTasks: TaskCategoryItem[] = [
  {
    id: "tsk-1",
    title: "Complete LinkedIn Profile",
    description: "Add FSP Certified Facilitator badge and upload your workshop portfolio.",
    category: "Marketing",
    priority: "High",
    dueDate: "Today",
    status: "Pending",
    points: 50,
  },
  {
    id: "tsk-2",
    title: "Upload Trainer Profile",
    description: "Submit your official corporate facilitator bio and proposal canvas.",
    category: "Certification",
    priority: "Medium",
    dueDate: "Tomorrow",
    status: "In Progress",
    points: 75,
  },
  {
    id: "tsk-3",
    title: "Watch Module 2",
    description: "Complete Module 2 video lessons on De-Escalating Team Conflict.",
    category: "Learning",
    priority: "Medium",
    dueDate: "Aug 18",
    status: "Pending",
    points: 100,
  },
  {
    id: "tsk-4",
    title: "Attend Wednesday Masterclass",
    description: "Live interactive breakout practice with senior FSP mentors.",
    category: "Practice",
    priority: "High",
    dueDate: "20 August",
    status: "Upcoming",
    points: 80,
  },
  {
    id: "tsk-5",
    title: "Read Chapter 4: The Facilitator's Field Guide",
    description: "Complete reading and log 3 key insights in your reading journal.",
    category: "Reading",
    priority: "Low",
    dueDate: "Aug 22",
    status: "Pending",
    points: 40,
  },
  {
    id: "tsk-6",
    title: "Post Case Study in FSP Lounge",
    description: "Share your top takeaways from your recent hybrid workshop session.",
    category: "Community",
    priority: "Medium",
    dueDate: "Aug 25",
    status: "Pending",
    points: 60,
  }
];

export const mockAchievementBadges: AchievementBadgeItem[] = [
  {
    id: "bdg-1",
    title: "First Task Completed",
    description: "Completed your very first learning activity.",
    icon: "Trophy",
    unlocked: true,
    unlockedDate: "02 Aug 2026",
  },
  {
    id: "bdg-2",
    title: "7-Day Streak",
    description: "Logged in and finished tasks 7 days in a row.",
    icon: "Flame",
    unlocked: true,
    unlockedDate: "08 Aug 2026",
  },
  {
    id: "bdg-[#bdg-3]",
    title: "30-Day Challenge",
    description: "Reached halfway mark in 30-Day Facilitator Challenge.",
    icon: "Rocket",
    unlocked: true,
    unlockedDate: "12 Aug 2026",
  },
  {
    id: "bdg-4",
    title: "Book Reader",
    description: "Finished 10 reading sessions in the journal.",
    icon: "BookOpen",
    unlocked: true,
    unlockedDate: "14 Aug 2026",
  },
  {
    id: "bdg-5",
    title: "Community Contributor",
    description: "Earn 50 upvotes on community lounge topics.",
    icon: "Users",
    unlocked: false,
  },
  {
    id: "bdg-6",
    title: "Top Performer",
    description: "Reach Rank #1 on monthly leaderboard.",
    icon: "Star",
    unlocked: false,
  }
];

export const mockLeaderboard: LeaderboardMemberItem[] = [
  {
    rank: 1,
    name: "Anand",
    points: 980,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    badge: "Gold Member",
  },
  {
    rank: 2,
    name: "Priya",
    points: 950,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    badge: "Silver Member",
  },
  {
    rank: 3,
    name: "Karunai",
    points: 910,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    badge: "Bronze Member",
    isCurrentUser: true,
  },
  {
    rank: 4,
    name: "Rahul",
    points: 860,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    badge: "Pro Member",
  }
];

export const mockTaskHistoryTable: TaskHistoryItem[] = [
  {
    id: "th-1",
    taskName: "Completed LinkedIn Profile",
    completedDate: "10 Aug",
    status: "Completed",
    pointsEarned: "50 Points",
  },
  {
    id: "th-2",
    taskName: "Finished Module 1",
    completedDate: "12 Aug",
    status: "Completed",
    pointsEarned: "100 Points",
  }
];

export const mockRemindersTimeline: ReminderItem[] = [
  {
    id: "rem-1",
    date: "Tomorrow",
    title: "Complete Reading",
    category: "Reading Journal",
  },
  {
    id: "rem-2",
    date: "20 Aug",
    title: "Masterclass",
    category: "Live Workshop",
  },
  {
    id: "rem-3",
    date: "25 Aug",
    title: "Challenge Submission",
    category: "Sprint Review",
  },
  {
    id: "rem-4",
    date: "31 Aug",
    title: "Challenge Completion",
    category: "Final Evaluation",
  }
];

export const mockLearningLevels: LearningLevelItem[] = [
  {
    level: "Level 1",
    title: "Foundations of Facilitation",
    fee: "₹4,000",
    status: "Paid",
    action: "Completed"
  },
  {
    level: "Level 2",
    title: "Interactive Workshop Design & Dynamics",
    fee: "₹7,000",
    status: "Pending",
    action: "Pay Now"
  },
  {
    level: "Level 3",
    title: "Executive De-Escalation & Leadership",
    fee: "₹7,000",
    status: "Locked",
    action: "Unavailable"
  },
  {
    level: "Level 4",
    title: "Master Facilitator & Guild Accreditation",
    fee: "₹10,000",
    status: "Locked",
    action: "Unavailable"
  }
];

export const mockPaymentHistory: PaymentHistoryItem[] = [
  {
    id: "pay-101",
    date: "01 Aug 2026",
    description: "Annual Membership",
    amount: "₹3,000",
    status: "Paid",
    invoiceUrl: "#"
  },
  {
    id: "pay-102",
    date: "15 Aug 2026",
    description: "Level 1 Facilitation Course",
    amount: "₹4,000",
    status: "Paid",
    invoiceUrl: "#"
  }
];

export const mockDashboardChallenges: ChallengeItem[] = [
  {
    id: "ch-1",
    title: "30 Day Challenge",
    subtitle: "Daily Facilitation Practice & Reflection",
    currentDays: 18,
    totalDays: 30,
  },
  {
    id: "ch-2",
    title: "21 Day Book Reading Challenge",
    subtitle: "High-Impact Workshop Books",
    month: "August",
    currentDays: 10,
    totalDays: 21,
  }
];

export const mockDashboardTasks: TaskItem[] = [
  {
    id: "dt-1",
    title: "Complete LinkedIn Profile",
    description: "Add FSP Facilitator badge and upload your 1-page workshop canvas to LinkedIn.",
    category: "Profile",
    status: "pending",
    dueDate: "Due Tomorrow",
  }
];

export const mockDashboardEvents: EventItem[] = [
  {
    id: "de-1",
    title: "FSP Catalyst Connect",
    date: "16 Aug",
    time: "7 PM",
    actionText: "Join Event",
    status: "Featured Event"
  }
];

export const mockAnnouncements: AnnouncementItem[] = [
  {
    id: "ann-1",
    title: "New Resource Added",
    description: "High-Conflict Facilitation Canvas added.",
    date: "2 hours ago",
    type: "resource",
    isNew: true,
  }
];

export const mockRecentActivities: ActivityItem[] = [
  {
    id: "act-1",
    title: "Completed Module 1",
    timestamp: "Today at 9:30 AM",
    icon: "CheckCircle2"
  }
];

export const mockTasks: TaskItem[] = [
  {
    id: "task-1",
    title: "Submit Q3 Workshop Facilitation Canvas",
    description: "Upload your completed 1-page workshop canvas.",
    category: "Workshop Prep",
    points: 50,
    dueDate: "Tomorrow, 5:00 PM",
    status: "in-progress",
    difficulty: "Intermediate",
  }
];

export const mockEvents: EventItem[] = [
  {
    id: "evt-1",
    title: "FSP Catalyst Connect",
    description: "Networking session.",
    date: "16 Aug, 2026",
    time: "7:00 PM - 8:30 PM UTC",
    duration: "90 min",
    speaker: {
      name: "Marcus Vance",
      role: "Head of Facilitation",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    type: "Catalyst Connect",
    attendeesCount: 180,
    isRSVPed: true,
  }
];

export const mockInvoices: InvoiceItem[] = [
  {
    id: "inv-001",
    invoiceNumber: "FSP-2026-0891",
    date: "01 Aug 2026",
    description: "Annual Membership",
    amount: "₹3,000",
    status: "Paid",
    downloadUrl: "#"
  }
];

export const mockCertificates: CertificateItem[] = [
  {
    id: "cert-1",
    title: "Advanced Group Facilitation Master 2026",
    credentialId: "FSP-CERT-99824",
    issueDate: "June 14, 2026",
    expiryDate: "June 2028",
    category: "Executive Leadership",
    skillsVerified: ["Boardroom Consensus"],
    certificateUrl: "#",
    badgeIcon: "Trophy"
  }
];

// ----- Certificate Management mock data -----

export interface CertificateTemplateItem {
  id: string;
  title: string;
  previewImage: string; // URL to preview image
  description?: string;
}

export const mockCertificateTemplates: CertificateTemplateItem[] = [
  { id: 'tmpl-1', title: 'Module 1 Certificate', previewImage: 'https://via.placeholder.com/300x200?text=Module+1' },
  { id: 'tmpl-2', title: 'Module 2 Certificate', previewImage: 'https://via.placeholder.com/300x200?text=Module+2' },
  { id: 'tmpl-3', title: 'Module 3 Certificate', previewImage: 'https://via.placeholder.com/300x200?text=Module+3' },
  { id: 'tmpl-4', title: 'Catalyst Connect', previewImage: 'https://via.placeholder.com/300x200?text=Catalyst+Connect' },
  { id: 'tmpl-5', title: 'Masterclass', previewImage: 'https://via.placeholder.com/300x200?text=Masterclass' },
  { id: 'tmpl-6', title: 'Challenge Completion', previewImage: 'https://via.placeholder.com/300x200?text=Challenge+Completion' },
  { id: 'tmpl-7', title: 'Community Contribution', previewImage: 'https://via.placeholder.com/300x200?text=Community+Contribution' },
  { id: 'tmpl-8', title: 'Corporate Program', previewImage: 'https://via.placeholder.com/300x200?text=Corporate+Program' },
];

export interface IssuedCertificateItem {
  id: string;
  member: string;
  memberId: string;
  courseOrEvent: string;
  eligibility: string;
  status: 'Issued' | 'Pending' | 'Revoked';
  issueDate: string;
}

export const mockIssuedCertificates: IssuedCertificateItem[] = [
  { id: 'cert-iss-1', member: 'Anand Sharma', memberId: 'FSP000101', courseOrEvent: 'Module 1', eligibility: 'Completed', status: 'Issued', issueDate: '01 Aug 2026' },
  { id: 'cert-iss-2', member: 'Priya Nair', memberId: 'FSP000102', courseOrEvent: 'Catalyst Connect', eligibility: 'Attended', status: 'Pending', issueDate: '05 Aug 2026' },
  { id: 'cert-iss-3', member: 'Raja Singh', memberId: 'FSP000103', courseOrEvent: 'Masterclass', eligibility: 'Completed', status: 'Issued', issueDate: '03 Aug 2026' },
];

export interface VerificationRequestItem {
  id: string;
  certificateId: string;
  member: string;
  requestDate: string;
  status: 'Verified' | 'Expired' | 'Revoked';
}

export const mockVerificationRequests: VerificationRequestItem[] = [
  { id: 'ver-1', certificateId: 'cert-1', member: 'Anand Sharma', requestDate: '10 Aug 2026', status: 'Verified' },
  { id: 'ver-2', certificateId: 'cert-2', member: 'Priya Nair', requestDate: '12 Aug 2026', status: 'Expired' },
];

export const mockCertificateAnalytics = {
  monthlyIssued: [
    { month: 'Jan', count: 120 },
    { month: 'Feb', count: 150 },
    { month: 'Mar', count: 180 },
    // ... more data
  ],
  downloads: [
    { month: 'Jan', count: 300 },
    { month: 'Feb', count: 350 },
  ],
  verificationRequests: [
    { month: 'Jan', count: 45 },
    { month: 'Feb', count: 60 },
  ],
  courseWise: [
    { course: 'Module 1', count: 400 },
    { course: 'Catalyst Connect', count: 250 },
  ],
};

// End of Certificate Management mock data

// Dummy habits data for Task Management page
export interface HabitItem {
  id: string;
  title: string;
  streakDays: number;
  targetFrequency: string;
  status: 'active' | 'paused' | 'completed';
}

export const mockHabits: HabitItem[] = [
  { id: 'hab-1', title: 'Daily Reflection', streakDays: 12, targetFrequency: 'Daily', status: 'active' },
  { id: 'hab-2', title: 'Read 30 mins', streakDays: 7, targetFrequency: 'Daily', status: 'active' },
  { id: 'hab-3', title: 'Practice Facilitation', streakDays: 3, targetFrequency: 'Weekly', status: 'active' },
];

// Dummy membership plans for Membership Management page
export const mockMembershipPlans = [
  {
    id: "plan-annual",
    name: "FSP Annual Membership",
    validity: "365 Days",
    price: "₹3,000",
    members: 980,
    status: "Active",
  },
  {
    id: "plan-lifetime",
    name: "FSP Lifetime Membership",
    validity: "Lifetime",
    price: "₹25,000",
    members: 42,
    status: "Active",
  },
  {
    id: "plan-corporate",
    name: "Corporate Membership",
    validity: "365 Days",
    price: "Custom",
    members: 18,
    status: "Active",
  },
];

// Dummy memberships for the members table
export const mockMemberships = [
  {
    memberName: "Anand Sharma",
    memberId: "FSP000101",
    plan: "FSP Annual Membership",
    startDate: "01 Aug 2025",
    expiryDate: "31 Jul 2026",
    remainingDays: 30,
    renewalAmount: "₹3,000",
    status: "Active",
    autoRenewal: true,
  },
  {
    memberName: "Priya Nair",
    memberId: "FSP000102",
    plan: "FSP Lifetime Membership",
    startDate: "15 Jan 2020",
    expiryDate: "Lifetime",
    remainingDays: "–",
    renewalAmount: "₹0",
    status: "Active",
    autoRenewal: false,
  },
  {
    memberName: "Raja Singh",
    memberId: "FSP000103",
    plan: "Corporate Membership",
    startDate: "10 Mar 2025",
    expiryDate: "09 Mar 2026",
    remainingDays: 15,
    renewalAmount: "Custom",
    status: "Pending",
    autoRenewal: true,
  },
];

// Dummy renewal center data
export const mockRenewalDue = [
  {
    name: "Anand Sharma",
    expiryDate: "15 Aug 2026",
    daysRemaining: 15,
    renewalFee: "₹3,000",
    reminderStatus: "Reminder Sent",
  },
  {
    name: "Sneha Patel",
    expiryDate: "20 Aug 2026",
    daysRemaining: 20,
    renewalFee: "₹3,000",
    reminderStatus: "Pending",
  },
];

// Dummy membership rules
export const mockMembershipRules = [
  { title: "Validity Period", description: "365 days for annual, lifetime for lifetime plans" },
  { title: "Grace Period", description: "30 days after expiry for renewal" },
  { title: "Renewal Reminder Schedule", description: "60/30/15/7/1 day reminders" },
  { title: "Auto Expiry", description: "Accounts auto‑expire if not renewed" },
  { title: "Membership Benefits", description: "Access to community, resources, masterclasses" },
  { title: "Renewal Discount", description: "10% discount for early renewal" },
];

// Dummy benefits list
export const mockMembershipBenefits = [
  { name: "Community Access", enabled: true },
  { name: "Resource Library", enabled: true },
  { name: "Masterclasses", enabled: true },
  { name: "Certificates", enabled: true },
  { name: "Challenges", enabled: true },
  { name: "Networking", enabled: true },
  { name: "Support", enabled: true },
  { name: "Downloads", enabled: true },
];

// Dummy analytics data placeholders (charts will be rendered with placeholder divs)
export const mockRenewalAnalytics = {
  renewalsByMonth: [], // populate with { month: "Jan", count: 10 }
  membershipGrowth: [],
  expiredVsActive: [],
  renewalRevenue: [],
};

// Dummy reminder timeline steps
export const mockReminderTimeline = [
  "60 Days Before",
  "30 Days Before",
  "15 Days Before",
  "7 Days Before",
  "1 Day Before",
  "Expired",
];

// Dummy quick actions
export const mockQuickActions = [
  { label: "Create Plan", icon: "Plus" },
  { label: "Renew Member", icon: "RefreshCcw" },
  { label: "Upgrade Plan", icon: "ArrowUp" },
  { label: "Export Report", icon: "Download" },
  { label: "Send Renewal Reminder", icon: "Mail" },
  { label: "Generate Invoice", icon: "FileInvoice" },
];





// Dummy members data for Member Management page
export const mockMembers = [
  {
    id: "FSP000145",
    name: "Karunai Prakash",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    mobile: "+91 98765 43210",
    email: "karunai@facilitators.org",
    city: "Chennai",
    membershipPlan: "Annual Membership",
    currentLevel: "Level 3",
    membershipStatus: "Active",
    expiryDate: "31 July 2027",
    paymentStatus: "Paid",
    tasksProgress: "80%",
    certificates: ["cert-1"],
    lastLogin: "2026-08-05 09:30 AM",
  },
  {
    id: "FSP000146",
    name: "Priya Nair",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    mobile: "+91 91234 56789",
    email: "priya@facilitators.org",
    city: "Bangalore",
    membershipPlan: "Quarterly Membership",
    currentLevel: "Level 2",
    membershipStatus: "Expired",
    expiryDate: "30 June 2026",
    paymentStatus: "Failed",
    tasksProgress: "45%",
    certificates: [],
    lastLogin: "2026-07-28 04:15 PM",
  },
  {
    id: "FSP000147",
    name: "Raja Singh",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    mobile: "+91 99887 66554",
    email: "raja@facilitators.org",
    city: "Hyderabad",
    membershipPlan: "Monthly Membership",
    currentLevel: "Level 1",
    membershipStatus: "Active",
    expiryDate: "15 Sep 2026",
    paymentStatus: "Paid",
    tasksProgress: "60%",
    certificates: [],
    lastLogin: "2026-08-04 11:20 AM",
  },
  // Add more dummy members as needed
];


export const mockPosts: CommunityPost[] = [
  {
    id: "post-1",
    author: {
      name: "David Kim",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      tier: "Annual Member",
      role: "Agile Coach & Facilitator"
    },
    title: "How do you handle a dominant VP?",
    content: "In yesterday's session...",
    category: "Group Dynamics",
    upvotes: 38,
    commentsCount: 14,
    postedAt: "2 hours ago",
    isLiked: true,
    tags: ["GroupDynamics"]
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Upcoming Live Event Reminder",
    message: "FSP Catalyst Connect starts on 16 August.",
    timestamp: "10 minutes ago",
    type: "event",
    isRead: false,
  }
];

// Dummy data for Course & Learning Management page
export const mockCourses = [
  {
    id: "course-1",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&auto=format&fit=crop&q=80",
    name: "FSP Master Program",
    trainer: "Anand Sharma",
    duration: "12 Weeks",
    modules: 3,
    students: 320,
    rating: 4.8,
    status: "Active",
  },
  {
    id: "course-2",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&auto=format&fit=crop&q=80",
    name: "Advanced Facilitation",
    trainer: "Priya Nair",
    duration: "8 Weeks",
    modules: 4,
    students: 210,
    rating: 4.5,
    status: "Draft",
  },
  {
    id: "course-3",
    thumbnail: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=300&auto=format&fit=crop&q=80",
    name: "Corporate Leadership",
    trainer: "Raja Singh",
    duration: "10 Weeks",
    modules: 5,
    students: 180,
    rating: 4.2,
    status: "Active",
  },
];

export const mockModules = {
  "course-1": [
    { id: "mod-1", name: "Module 1: Foundations" },
    { id: "mod-2", name: "Module 2: Advanced Techniques" },
    { id: "mod-3", name: "Module 3: Capstone" },
  ],
  "course-2": [
    { id: "mod-4", name: "Module 1: Theory" },
    { id: "mod-5", name: "Module 2: Practice" },
    { id: "mod-6", name: "Module 3: Review" },
    { id: "mod-7", name: "Module 4: Assessment" },
  ],
};

export const mockLessons = {
  "mod-1": [
    { id: "les-1", title: "Lesson 1: Introduction", duration: "15m" },
    { id: "les-2", title: "Lesson 2: Basics", duration: "20m" },
    { id: "les-3", title: "Lesson 3: First Exercise", duration: "25m" },
  ],
  "mod-2": [
    { id: "les-4", title: "Lesson 1: Deep Dive", duration: "30m" },
    { id: "les-5", title: "Lesson 2: Case Study", duration: "35m" },
  ],
  "mod-3": [
    { id: "les-6", title: "Lesson 1: Project", duration: "45m" },
    { id: "les-7", title: "Lesson 2: Presentation", duration: "40m" },
  ],
};



export const mockAssignments = [
  { id: "asg-1", name: "Reflection Essay", linkedModule: "Module 1", dueDate: "2026-09-10", status: "Submitted", maxScore: 100 },
  { id: "asg-2", name: "Case Study Analysis", linkedModule: "Module 2", dueDate: "2026-09-20", status: "Pending", maxScore: 100 },
  { id: "asg-3", name: "Project Presentation", linkedModule: "Module 3", dueDate: "2026-10-01", status: "Pending", maxScore: 100 },
];

export const mockCourseAnalytics = {
  courseCompletion: [], // placeholder for chart data
  moduleCompletion: [],
  studentProgress: [],
  popularCourses: [],
};

export const mockEnrollments = [
  { member: "Anand Sharma", course: "FSP Master Program", enrollmentDate: "2026-01-15", progress: "85%", completion: "Completed", status: "Active" },
  { member: "Priya Nair", course: "Advanced Facilitation", enrollmentDate: "2026-03-22", progress: "45%", completion: "In Progress", status: "Active" },
  { member: "Raja Singh", course: "Corporate Leadership", enrollmentDate: "2026-04-10", progress: "20%", completion: "In Progress", status: "Pending" },
];

export const mockCourseSettings = [
  { title: "Course Visibility", value: "Public" },
  { title: "Pricing", value: "Paid" },
  { title: "Course Duration", value: "12 Weeks" },
  { title: "Access Period", value: "Lifetime" },
  { title: "Completion Rules", value: "All modules must be completed" },
  { title: "Certificate Linked", value: "Yes" },
];

export const mockAIBuilderOptions = [
  { label: "Generate Course Outline", icon: "Layout" },
  { label: "Generate Learning Objectives", icon: "Target" },
  { label: "Generate Workbook", icon: "FileText" },
  { label: "Generate Quiz", icon: "HelpCircle" },
  { label: "Generate Assignment", icon: "Clipboard" },
  { label: "Generate Icebreaker", icon: "Snowflake" },
  { label: "Generate Reflection Questions", icon: "MessageSquare" },
];

export const mockCourseQuickActions = [
  { label: "Create Course", icon: "Plus" },
  { label: "Create Module", icon: "FolderPlus" },
  { label: "Upload Video", icon: "FileVideo2" },
  { label: "Upload Resource", icon: "Upload" },
  { label: "Assign Course", icon: "UserCheck" },
  { label: "View Analytics", icon: "BarChart2" },
];

// ------ Payment Management Mock Data ------

export interface PaymentRecordItem {
  invoiceNo: string;
  member: string;
  memberId: string;
  paymentType: string;
  amount: string;
  gst: string;
  method: string;
  transactionId: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

export const mockPaymentRecords: PaymentRecordItem[] = [
  {
    invoiceNo: 'INV-1001',
    member: 'Anand Sharma',
    memberId: 'FSP000101',
    paymentType: 'Membership',
    amount: '₹3,000',
    gst: '₹540',
    method: 'Credit Card',
    transactionId: 'TXN-20230801-01',
    date: '01 Aug 2026',
    status: 'Paid',
  },
  {
    invoiceNo: 'INV-1002',
    member: 'Priya Nair',
    memberId: 'FSP000102',
    paymentType: 'Level 2',
    amount: '₹7,000',
    gst: '₹1,260',
    method: 'UPI',
    transactionId: 'TXN-20230803-02',
    date: '03 Aug 2026',
    status: 'Pending',
  },
  {
    invoiceNo: 'INV-1003',
    member: 'Raja Singh',
    memberId: 'FSP000103',
    paymentType: 'Corporate',
    amount: '₹25,000',
    gst: '₹4,500',
    method: 'Bank Transfer',
    transactionId: 'TXN-20230805-03',
    date: '05 Aug 2026',
    status: 'Failed',
  },
];

export interface RenewalCardItem {
  memberName: string;
  membershipPlan: string;
  expiryDate: string;
  renewalAmount: string;
  reminderStatus: string;
}

export const mockRenewalCards: RenewalCardItem[] = [
  { memberName: 'Anand Sharma', membershipPlan: 'Annual Membership', expiryDate: '15 Aug 2026', renewalAmount: '₹3,000', reminderStatus: 'Reminder Sent' },
  { memberName: 'Sneha Patel', membershipPlan: 'Annual Membership', expiryDate: '20 Aug 2026', renewalAmount: '₹3,000', reminderStatus: 'Pending' },
];

export interface LearningLevelPaymentItem {
  level: string;
  price: string;
  paidMembers: number;
  pending: number;
}

export const mockLearningLevelPayments: LearningLevelPaymentItem[] = [
  { level: 'Level 1', price: '₹4,000', paidMembers: 245, pending: 12 },
  { level: 'Level 2', price: '₹7,000', paidMembers: 160, pending: 34 },
  { level: 'Level 3', price: '₹7,000', paidMembers: 85, pending: 18 },
  { level: 'Level 4', price: '₹10,000', paidMembers: 22, pending: 9 },
];

export interface DiscountCouponItem {
  title: string;
  discountPercent: string;
}

export const mockCoupons: DiscountCouponItem[] = [
  { title: 'Early Bird', discountPercent: '10%' },
  { title: 'Corporate Discount', discountPercent: '15%' },
  { title: 'Referral Discount', discountPercent: '5%' },
  { title: 'Festival Offer', discountPercent: '20%' },
];

export interface RefundRequestItem {
  requestId: string;
  member: string;
  reason: string;
  amount: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  date: string;
}

export const mockRefundRequests: RefundRequestItem[] = [
  { requestId: 'RF-001', member: 'Anand Sharma', reason: 'Course Cancellation', amount: '₹3,000', status: 'Pending', date: '08 Aug 2026' },
  { requestId: 'RF-002', member: 'Priya Nair', reason: 'Overpayment', amount: '₹540', status: 'Approved', approvedBy: 'Admin', date: '09 Aug 2026' },
];

export interface OutstandingPaymentItem {
  member: string;
  pendingAmount: string;
  daysOverdue: number;
  reminderCount: number;
}

export const mockOutstandingPayments: OutstandingPaymentItem[] = [
  { member: 'Raja Singh', pendingAmount: '₹7,000', daysOverdue: 12, reminderCount: 2 },
  { member: 'Sneha Patel', pendingAmount: '₹3,000', daysOverdue: 5, reminderCount: 1 },
];

// Revenue Analytics data for charts
export const mockRevenueAnalytics = {
  monthlyRevenue: [
    { month: 'Jan', amount: 350000 },
    { month: 'Feb', amount: 420000 },
    { month: 'Mar', amount: 480000 },
    { month: 'Apr', amount: 460000 },
    { month: 'May', amount: 500000 },
    { month: 'Jun', amount: 530000 },
    { month: 'Jul', amount: 560000 },
    { month: 'Aug', amount: 480000 },
  ],
  membershipRevenue: [
    { month: 'Jan', amount: 200000 },
    { month: 'Feb', amount: 250000 },
    { month: 'Mar', amount: 300000 },
    // ... more data
  ],
  levelRevenue: [
    { level: 'Level 1', amount: 120000 },
    { level: 'Level 2', amount: 180000 },
    { level: 'Level 3', amount: 150000 },
    { level: 'Level 4', amount: 200000 },
  ],
  renewalRevenue: [
    { month: 'Jan', amount: 80000 },
    { month: 'Feb', amount: 90000 },
    // ...
  ],
  corporateRevenue: [
    { month: 'Jan', amount: 50000 },
    { month: 'Feb', amount: 60000 },
    // ...
  ],
};

// Finance Reports data placeholders
export const mockFinanceReports = {
  monthlyCollection: [], // array of { month, amount }
  paymentMethodDistribution: [], // array of { method, percentage }
  outstandingPayments: [], // array of { member, amount }
  revenueGrowth: [], // array of { month, growthPct }
};

// End of Payment Management mock data


// ----- Resource Library Management mock data -----

export interface ResourceItem {
  id: string;
  name: string;
  category: string;
  fileType: string;
  size: string;
  uploadedBy: string;
  accessLevel: string;
  downloads: number;
  status: 'Active' | 'Archived';
  uploadDate: string;
  previewUrl?: string;
}

export const mockResources: ResourceItem[] = [
  {
    id: 'res-1',
    name: 'Facilitation Guide.pdf',
    category: 'Workbooks',
    fileType: 'PDF',
    size: '2.5 MB',
    uploadedBy: 'Anand Sharma',
    accessLevel: 'Public',
    downloads: 1245,
    status: 'Active',
    uploadDate: '01 Aug 2026',
    previewUrl: '#',
  },
  {
    id: 'res-2',
    name: 'Team Building Activities.mp4',
    category: 'Team Building Games',
    fileType: 'Video',
    size: '150 MB',
    uploadedBy: 'Priya Nair',
    accessLevel: 'Members Only',
    downloads: 980,
    status: 'Active',
    uploadDate: '05 Aug 2026',
    previewUrl: '#',
  },
  {
    id: 'res-3',
    name: 'Ice Breaker Template.canva',
    category: 'Canva Templates',
    fileType: 'Canva',
    size: '1.2 MB',
    uploadedBy: 'Raja Singh',
    accessLevel: 'Premium Members',
    downloads: 760,
    status: 'Active',
    uploadDate: '03 Aug 2026',
    previewUrl: '#',
  },
];

export interface ResourceCategoryItem {
  id: string;
  title: string;
  icon?: string;
}

export const mockResourceCategories: ResourceCategoryItem[] = [
  { id: 'cat-1', title: 'Training Activities' },
  { id: 'cat-2', title: 'Ice Breakers' },
  { id: 'cat-3', title: 'Team Building Games' },
  { id: 'cat-4', title: 'Reflection Activities' },
  { id: 'cat-5', title: 'Debrief Questions' },
  { id: 'cat-6', title: 'Workbooks' },
  { id: 'cat-7', title: 'Worksheets' },
  { id: 'cat-8', title: 'Proposal Templates' },
  { id: 'cat-9', title: 'Marketing Templates' },
  { id: 'cat-10', title: 'Canva Templates' },
  { id: 'cat-11', title: 'Presentation Slides' },
  { id: 'cat-12', title: 'Videos' },
  { id: 'cat-13', title: 'Audio Files' },
  { id: 'cat-14', title: 'Assessment Forms' },
  { id: 'cat-15', title: 'Certificates' },
  { id: 'cat-16', title: 'Facilitator Toolkit' },
];

export interface ResourceFolderItem {
  id: string;
  name: string;
  parentId?: string;
}

export const mockResourceFolders: ResourceFolderItem[] = [
  { id: 'fld-1', name: 'Corporate Programs' },
  { id: 'fld-2', name: 'Leadership' },
  { id: 'fld-3', name: 'Communication' },
  { id: 'fld-4', name: 'Trust Building' },
  { id: 'fld-5', name: 'OBT Activities' },
  { id: 'fld-6', name: 'FSP Modules' },
  { id: 'fld-7', name: 'Challenges' },
  { id: 'fld-8', name: 'Masterclasses' },
  { id: 'fld-9', name: 'Community' },
];

export interface FeaturedResourceItem {
  id: string;
  title: string;
  description?: string;
}

export const mockFeaturedResources: FeaturedResourceItem[] = [
  { id: 'feat-1', title: 'Activity of the Week' },
  { id: 'feat-2', title: 'Proposal Template' },
  { id: 'feat-3', title: 'Facilitator Toolkit' },
  { id: 'feat-4', title: 'Marketing Kit' },
  { id: 'feat-5', title: 'Challenge Workbook' },
];

export interface AccessControlItem {
  level: string;
  description?: string;
}

export const mockAccessControls: AccessControlItem[] = [
  { level: 'Public' },
  { level: 'Members Only' },
  { level: 'Premium Members' },
  { level: 'Level 1' },
  { level: 'Level 2' },
  { level: 'Level 3' },
  { level: 'Level 4' },
  { level: 'Admin Only' },
];

// End of Resource Library Management mock data

export const mockSystemSettings = {
  branding: {
    logoUrl: "https://via.placeholder.com/150",
    primaryColor: "#1D3A8F",
    secondaryColor: "#F5A623",
    accentColor: "#10B981"
  },
  integrations: [
    { name: "Stripe", enabled: true, icon: "CreditCard" },
    { name: "Zoom", enabled: false, icon: "Video" },
    { name: "Google Analytics", enabled: true, icon: "BarChart2" }
  ],
  permissions: [
    { role: "Admin", canEditSettings: true, canManageUsers: true },
    { role: "Trainer", canEditSettings: false, canManageUsers: false },
    { role: "Member", canEditSettings: false, canManageUsers: false }
  ],
  featureToggles: [
    { feature: "DarkMode", enabled: true },
    { feature: "BetaAccess", enabled: false }
  ]
};


