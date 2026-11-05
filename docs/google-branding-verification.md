# Google OAuth branding verification

Use the same identity in Google Auth Platform and on the public website:

- App name: **FSP Community**
- Homepage: https://fspcommunitydashboard.vercel.app/about
- Privacy policy: https://fspcommunitydashboard.vercel.app/privacy
- Support email: keypurposetraining@gmail.com

## Deploy and check

Deploy the updated source to the Vercel project serving this hostname. Check
the connected repository and production branch (see vercel-deployment.md).
Open both URLs in a signed-out browser. The homepage must show FSP Community
and link to the full public privacy policy without requiring authentication.
Confirm the policy describes actual production practices before submitting it.

## Verify ownership

In Google Search Console, add a URL-prefix property for
`https://fspcommunitydashboard.vercel.app/` using the Google account associated
with the OAuth project. Choose HTML file verification.

The repository already contains `public/google4c0655104e7daccc.html`. If Search
Console gives you that exact file, confirm that
`https://fspcommunitydashboard.vercel.app/google4c0655104e7daccc.html` serves its
verification contents without login or redirects, then click Verify. If Google
gives you a different file, use that file instead and make its exact path public
in `src/proxy.ts` before deploying. Keep the verification file deployed.

An uploaded file alone does not establish verified ownership: Search Console
must report success for the account associated with the project. If the
subdomain cannot be verified, use an owned custom domain and update the homepage
and privacy URLs accordingly.

After ownership succeeds, wait the **24 hours** requested in the rejection notice.
Confirm all three issues are resolved, then select **I have fixed the issues**
and request branding re-verification. Additional review is for findings you
believe are incorrect; it does not replace ownership verification or deployment.

References:
- https://support.google.com/cloud/answer/13807376
- https://support.google.com/cloud/answer/13806988
- https://support.google.com/cloud/answer/13804963
