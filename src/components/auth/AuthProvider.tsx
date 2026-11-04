"use client";
// src/components/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { logMemberActivity } from '@/lib/activity-log';

/**
 * Role values are stored in the "users" table in lowercase.
 * UI displays friendly names via a helper later.
 */
export type Role = 'super_admin' | 'admin' | 'trainer' | 'member' | null;

/**
 * Minimal user profile pulled from the "users" table.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
  avatar_url?: string | null;
}

/**
 * Effective membership state for UI purposes. 'none' = no membership record yet
 * (a new member who has not been approved). Never defaulted to 'active'.
 */
export type MembershipState = 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended' | 'none';

interface AuthContextProps {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  role: Role;
  membershipStatus: MembershipState | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  loading: true,
  role: null,
  membershipStatus: null,
  login: async () => {},
  signUp: async () => ({ needsEmailConfirmation: true }),
  loginWithGoogle: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  updatePassword: async () => {},
  refreshUser: async () => {},
});

/**
 * Fetches the trusted profile from public.users (RLS: own row only) and, for
 * member/trainer accounts, the latest membership status.
 *
 * The role shown in the UI always comes from public.users. user_metadata is
 * never used for the role: it is writable by the signed-in user. Membership
 * state is never defaulted to 'active'; a missing record is 'none'.
 * UI role checks are presentation only; RLS and the server enforce access.
 */
const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AuthUser & { membershipStatus: MembershipState | null }> => {
  // Use maybeSingle so that a missing row doesn't throw a PGRST116 error.
  // These lookups are independent; avoid two sequential network round trips.
  const [userResult, memberResult] = await Promise.all([createClient()
    .from('users')
    .select('id, email, role, name')
    .eq('id', supabaseUser.id)
    .maybeSingle(), createClient().from('members').select('id, avatar_url')
      .eq('user_id', supabaseUser.id).order('created_at', { ascending: true })
      .limit(1).maybeSingle()]);
  let { data: userData } = userResult;
  const { error: userErr } = userResult;
  let memberProfile = memberResult.data;

  if (userErr) {
    console.error('Failed to fetch user profile', userErr.message, userErr);
  }

  // If no matching public.users row, trigger self-healing sync via RPC
  if (!userData) {
    try {
      const { data: syncRes, error: syncErr } = await createClient().rpc('sync_current_user');
      if (!syncErr && syncRes?.success) {
        const { data: refetched } = await createClient()
          .from('users')
          .select('id, email, role, name')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        if (refetched) {
          userData = refetched;
        }
        if (!memberProfile) {
          const { data } = await createClient().from('members').select('id, avatar_url')
            .eq('user_id', supabaseUser.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
          memberProfile = data;
        }
      } else if (syncRes && !syncRes.success) {
        console.warn('sync_current_user:', syncRes.error);
      }
    } catch (rpcErr) {
      console.warn('RPC sync_current_user notice:', rpcErr);
    }
  }

  // Profile not available yet: show the least-privileged UI. Name may come from
  // metadata (display only); the role never does.
  if (!userData) {
    const metaName =
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'Member';
    userData = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      role: 'member',
      name: metaName,
    };
  }

  let membershipStatus: MembershipState | null = null;
  if (userData.role === 'member' || userData.role === 'trainer') {
    try {
      const memberRec = memberProfile;

      if (!memberRec) {
        membershipStatus = 'none';
      } else {
        const { data: membershipData, error: memErr } = await createClient()
          .from('memberships')
          .select('status, end_date')
          .eq('member_id', memberRec.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (memErr) {
          console.warn('Failed to load membership', memErr.message);
          membershipStatus = null; // unknown; do not grant anything
        } else if (!membershipData) {
          membershipStatus = 'none';
        } else if (membershipData.status === 'active' && membershipData.end_date
                   && new Date(membershipData.end_date) < new Date()) {
          membershipStatus = 'expired';
        } else {
          membershipStatus = membershipData.status as MembershipState;
        }
      }
    } catch {
      membershipStatus = null;
    }
  }

  return {
    id: userData.id,
    email: userData.email,
    role: (userData.role || 'member') as Role,
    name: userData.name,
    avatar_url: memberProfile?.avatar_url ?? null,
    membershipStatus,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<Role>(null);
  const [membershipStatus, setMembershipStatus] = useState<MembershipState | null>(null);
  const profileRequests = useRef(new Map<string, ReturnType<typeof fetchUserProfile>>());

  // Public refresh: re-reads the current session user. (Calling the internal
  // refreshUser without a user clears the session state, i.e. a UI sign-out.)
  const refreshCurrentUser = async () => {
    const { data } = await createClient().auth.getUser();
    if (data.user) await refreshUser(data.user);
  };

  const refreshUser = async (supabaseUser?: SupabaseUser) => {
    try {
      if (!supabaseUser) {
        setUser(null);
        setRole(null);
        setMembershipStatus(null);
        return;
      }
      // Sign-in also emits an auth event. Share only concurrent requests;
      // no persistent cache of roles or permissions is introduced.
      let request = profileRequests.current.get(supabaseUser.id);
      if (!request) {
        request = fetchUserProfile(supabaseUser);
        profileRequests.current.set(supabaseUser.id, request);
      }
      let profile: Awaited<ReturnType<typeof fetchUserProfile>>;
      try { profile = await request; }
      finally {
        if (profileRequests.current.get(supabaseUser.id) === request) profileRequests.current.delete(supabaseUser.id);
      }
      setUser({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
        avatar_url: profile.avatar_url,
      });
      setRole(profile.role);
      setMembershipStatus(profile.membershipStatus);
    } catch (e) {
      console.error('Error refreshing user', e);
      setUser(null);
      setRole(null);
      setMembershipStatus(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Leave the auth callback before invoking Supabase again: it holds
        // the session lock while notifying listeners.
        const timer = setTimeout(() => {
          pending.delete(timer);
          if (!mounted) return;
          void refreshUser(newSession.user).finally(() => { if (mounted) setLoading(false); });
        }, 0);
        pending.add(timer);
      } else {
        setUser(null);
        setRole(null);
        setMembershipStatus(null);
        setLoading(false);
      }
    });

    // onAuthStateChange emits INITIAL_SESSION after SDK initialization.
    // Calling getSession as well loads the same profile twice on every visit.

    return () => {
      mounted = false;
      pending.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error, data } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      await logMemberActivity("AUTH_LOGIN_FAILED", { email });
      setLoading(false);
      throw error;
    }
    // signInWithPassword already persists the session through the SSR client.
    try {
      await refreshUser(data.user);
      await logMemberActivity("AUTH_LOGIN", { provider: "email" });
    } catch (e: unknown) {
      await logMemberActivity("AUTH_LOGIN_FAILED", { email, reason: e instanceof Error ? e.message : "refresh_failed" });
      console.error('Login refreshUser failed', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Server-side code exchange (src/app/auth/callback/route.ts) sets the
          // session cookie before proxy.ts checks the protected route.
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        await logMemberActivity("AUTH_LOGIN_FAILED", { provider: 'google', error: error.message });
        setLoading(false);
        throw error;
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    await logMemberActivity("AUTH_LOGOUT");
    const { error } = await createClient().auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
    setUser(null);
    setRole(null);
    setMembershipStatus(null);
    setSession(null);
    setLoading(false);
  };

  /**
   * Creates a platform account. The role is never sent from here: _sync_user()
   * (002_user_sync.sql) creates the public.users row with the default 'member'
   * role, and only set_user_role() can change it. Passing a role through
   * user_metadata would be ignored by design.
   *
   * Returns whether Supabase requires the address to be confirmed before a
   * session exists, so the caller can show the right next step instead of
   * assuming the user is signed in.
   */
  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email,
        password,
        options: {
          // Display name only. Not trusted for authorization anywhere.
          data: name?.trim() ? { full_name: name.trim() } : undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      if (data.session?.user) {
        await refreshUser(data.session.user);
        return { needsEmailConfirmation: false };
      }
      return { needsEmailConfirmation: true };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        membershipStatus,
        login,
        signUp,
        loginWithGoogle,
        logout,
        forgotPassword,
        updatePassword,
        refreshUser: refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
