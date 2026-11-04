import { redirect } from "next/navigation";

// Registration now happens through Google sign-in + the membership application.
// (The previous page stored registrations and plaintext passwords in localStorage.)
export default function RegisterRedirect() {
  redirect("/application");
}
