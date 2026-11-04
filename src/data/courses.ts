export interface Course {
  id: string;
  title: string;
  shortCode: string;
  description: string;
  category: "Course";
  duration?: string;
  modules?: number;
  price?: number;
  currency?: string;
}

export const courses: Course[] = [
  {
    id: "FSP-30DC",
    title: "FSP 30 Days Challenge",
    shortCode: "FSP 30DC",
    description: "A 30-day intensive daily practice program to build facilitation habits, sharpen core skills, and develop reflective practice through structured daily exercises and peer accountability.",
    category: "Course",
    duration: "30 Days",
    modules: 4,
    price: 12000,
    currency: "INR",
  },
  {
    id: "FSP-GGC",
    title: "FSP TTX — 2-Day Transformational Residential Experience",
    shortCode: "FSP TTX",
    description: "Step away from your routine. Step into an immersive two-day residential experience focused on self-discovery, meaningful connection, and personal growth. Reflect on your goals, explore fresh perspectives, and return with renewed clarity and practical next steps.",
    category: "Course",
    duration: "2 Days · Residential",
    price: 15000,
    currency: "INR",
  },
  {
    id: "FSP-GA",
    title: "FSP GTX — Growth Transformation Experience",
    shortCode: "FSP GTX",
    description: "A six-month journey to turn your growth goals into consistent action. Strengthen your facilitation practice, build confidence, and develop habits that support personal and professional progress through intentional practice and reflection.",
    category: "Course",
    duration: "6 Months",
    price: 60000,
    currency: "INR",
  },
];

// Helper function to get course count
export function getCoursesCount(): number {
  return courses.length;
}

// Helper to get course by ID
export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}
