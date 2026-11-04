/** Navigation only. Proxy and database policies still enforce access. */
export function roleHome(role: string | null | undefined): string {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin';
  return '/dashboard';
}

export function loginDestination(role: string | null | undefined, requested = ''): string {
  const home = roleHome(role);
  if (!requested.startsWith('/') || requested.startsWith('//') || /[\\\u0000-\u0020]/.test(requested)) return home;
  try {
    const url = new URL(requested, 'https://local.invalid');
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== 'https://local.invalid' || /[\\\u0000-\u0020]/.test(path) || path.startsWith('//')) return home;
    const within = (prefix: string) => path === prefix || path.startsWith(prefix + '/');
    if (path === '/' || path === '/dashboard' || ['/login','/signup','/auth','/api','/_next','/forgot-password','/reset-password','/organizations'].some(within)) return home;
    if (role === 'super_admin') return within('/admin') || within('/super-admin') ? requested : home;
    if (role === 'admin') {
      const sections = ['/admin/members','/admin/payments','/admin/courses','/admin/memberships','/admin/updates','/admin/audit-logs','/admin/account'];
      return path === '/admin' || path === '/admin/dashboard' || (sections.some(within) && path !== '/admin/members/new') ? requested : home;
    }
    return within('/admin') || within('/super-admin') ? home : requested;
  } catch { return home; }
}
