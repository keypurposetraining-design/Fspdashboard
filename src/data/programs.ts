export interface Program {
  id: string;
  title: string;
  shortCode: string;
  description: string;
  category: "Program";
  frequency?: string;
  format?: string;
  price?: number;
  currency?: string;
}

export const programs: Program[] = [
  {
    id: "FSP-MM",
    title: "FSP Mastermind",
    shortCode: "FSP MM",
    description: "Exclusive peer-to-peer mastermind group for senior facilitators. Monthly deep-dive sessions on complex facilitation challenges, business growth strategies, and thought leadership development.",
    category: "Program",
    frequency: "Monthly",
    format: "Live Online + In-Person Retreats",
    price: 0,
    currency: "INR",
  },
  {
    id: "FSP-CC",
    title: "FSP Catalyst Connect",
    shortCode: "FSP CC",
    description: "Flagship networking and collaboration event bringing together trainers, HR professionals, and facilitators for a powerful day of connections, ideas, and growth. Connect • Collaborate • Conquer.",
    category: "Program",
    frequency: "Quarterly",
    format: "Offline",
    price: 0,
    currency: "INR",
  },
  {
    id: "FSP-WM",
    title: "FSP Wednesday Masterclass",
    shortCode: "FSP WM",
    description: "Weekly live masterclass series featuring expert facilitators sharing advanced techniques, case studies, and interactive practice sessions. Open to all members for continuous skill development.",
    category: "Program",
    frequency: "Weekly (Wednesdays)",
    format: "Live Online",
    price: 0,
    currency: "INR",
  },
  {
    id: "FSP-HC",
    title: "FSP Habit Circle",
    shortCode: "FSP HC",
    description: "Daily habit-building community for facilitators. Structured micro-practices, accountability partners, and weekly reflection circles to embed facilitation habits into daily professional life.",
    category: "Program",
    frequency: "Daily",
    format: "Online Community + Weekly Live",
    price: 0,
    currency: "INR",
  },
  {
    id: "FSP-GST",
    title: "FSP Goal Setting Time",
    shortCode: "FSP GST",
    description: "Monthly guided goal-setting and strategic planning session for facilitators. Clarify priorities, set measurable objectives, and create actionable roadmaps for professional growth.",
    category: "Program",
    frequency: "Monthly",
    format: "Live Online",
    price: 0,
    currency: "INR",
  },
  {
    id: "FSP-BB",
    title: "FSP Beyond Barriers",
    shortCode: "FSP BB",
    description: "Specialized program addressing facilitation challenges in high-stakes, cross-cultural, and conflict-intensive environments. Advanced tools for psychological safety and inclusive dialogue.",
    category: "Program",
    frequency: "Bi-Monthly",
    format: "Live Online + Workshops",
    price: 3000,
    currency: "INR",
  },
  {
    id: "FSP-FD",
    title: "FSP Fun Day",
    shortCode: "FSP FD",
    description: "Quarterly community celebration and informal networking event. Games, icebreakers, peer recognition, and relaxed connection time for the FSP facilitator community.",
    category: "Program",
    frequency: "Quarterly",
    format: "Offline / Hybrid",
    price: 0,
    currency: "INR",
  },
];

// Helper function to get program count
export function getProgramsCount(): number {
  return programs.length;
}

// Helper to get program by ID
export function getProgramById(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}
