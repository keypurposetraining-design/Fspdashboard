import { redirect } from "next/navigation";

// The old single-page tab switcher was split into dedicated routes.
export default function Home() {
  redirect("/dashboard");
}
