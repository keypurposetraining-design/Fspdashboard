import PublicInformation from "@/components/ui/PublicInformation";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return <PublicInformation title="Terms of service">
    <p>Last updated: 5 November 2026. These terms cover use of the FSP Community portal managed by Key Purpose Training Solutions. Questions can be sent to <a href="mailto:keypurposetraining@gmail.com">keypurposetraining@gmail.com</a>.</p>
    <section><h2>Accounts</h2><p>Provide accurate information, keep your sign-in credentials secure, and use only accounts you are authorized to access. Contact us if you suspect unauthorized access.</p></section>
    <section><h2>Membership and programs</h2><p>Creating an account does not automatically grant a paid membership or program enrollment. Administrators assign and manage membership dates and status. Check the dates shown in your account and the details of each program, including schedule, mode, fees, and any enrollment requirements.</p></section>
    <section><h2>Payments and cancellations</h2><p>Follow the payment instructions provided for the selected program. Submitted payment references and receipts are subject to review. Confirm applicable cancellation, rescheduling, and refund conditions with the FSP team before paying if they are not stated in the program details. These terms do not establish a blanket refund entitlement or a blanket no-refund rule, and do not limit rights provided by applicable law.</p></section>
    <section><h2>Acceptable use and uploads</h2><p>Do not impersonate others, submit false payment evidence, upload unlawful or harmful content, interfere with the service, or attempt to access other other private records. Submit only materials you have permission to share. Program materials remain subject to the rights of their respective owners.</p></section>
    <section><h2>Availability and account access</h2><p>Features and schedules may change, and access may be interrupted for maintenance or technical reasons. Administrators may restrict accounts for misuse or security concerns. Contact support to ask about an access restriction or an account closure request.</p></section>
    <section><h2>Privacy and changes</h2><p>See the privacy policy linked below for how portal information is processed. Updated terms will be published here with a revised date. Applicable statutory rights remain unaffected.</p></section>
  </PublicInformation>;
}

