export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  membershipType: string;
  membershipStartDate: string; // ISO date string
  membershipEndDate: string;   // ISO date string
  role: "super-admin" | "admin" | "trainer" | "member";
  status: string;
  learningLevel: string;
  profilePhoto: string;
  password: string; // mock password for demonstration
}
