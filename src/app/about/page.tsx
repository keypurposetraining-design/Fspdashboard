import PublicInformation from "@/components/ui/PublicInformation";
import Link from "next/link";

export const metadata = { title: "About FSP Community" };

export default function AboutPage() {
  return <PublicInformation title="FSP Community">
    <p>FSP Community is the Facilitator Support Program member portal, managed by Key Purpose Training Solutions. Members can view membership dates, explore scheduled programs, manage enrollments, follow course tasks, and receive account notifications.</p>
    <section><h2>Your member account</h2><p>Create an account using your name and email, or sign in with Google. Membership dates and approvals are managed separately by authorized administrators.</p></section>
    <section><h2>How we use Google sign-in</h2><p>Google sign-in identifies your account using basic profile information. It does not provide this portal with your Google password or access to your Gmail messages or Google Drive files.</p></section>
    <p><Link href="/login">Sign in</Link> or <Link href="/signup">create an account</Link>. Read our <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms of service</Link> before using the portal.</p>
    <p>Contact: <a href="mailto:keypurposetraining@gmail.com">keypurposetraining@gmail.com</a>.</p>
  </PublicInformation>;
}
