import { redirect } from 'next/navigation';

// Compatibility for bookmarks: all accounts now use the same sign-in form.
export default async function LegacyAdminLogin({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['redirect', 'error']) {
    const value = params[key];
    if (typeof value === 'string') query.set(key, value);
  }
  redirect(query.size ? `/login?${query.toString()}` : '/login');
}
