"use client";
// src/components/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
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
}

interface AuthContextProps {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  role: Role;
  membershipStatus: 'active' | 'expired' | null;
  login: (email: string, password: string) => Promise<void>;
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
  logout: async () => {},
  forgotPassword: async () => {},
  updatePassword: async () => {},
  refreshUser: async () => {},
});

/**
 * Helper to fetch the user profile from the "users" table and, if the role is
 * "member", also fetch the latest membership status.
 */
const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AuthUser & { membershipStatus: 'active' | 'expired' | null }> => {
  // Use maybeSingle so that a missing row doesn't throw a PGRST116 error.
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('id, email, role, name')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  if (userErr) {
    console.error('Failed to fetch user profile', userErr.message, userErr);
    // Propagate any other errors
    throw userErr;
  }

  // If there is no matching public.users row, fall back to basic auth info.
  if (!userData) {
    // No matching public.users row – throw a clear error.
    throw new Error('Authenticated user has no matching public.users profile');
  }


  let membershipStatus: 'active' | 'expired' | null = null;

  if (userData?.role === 'member') {
    const { data: membershipData, error: memErr } = await supabase
      .from('memberships')
      .select('status, end_date')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (memErr) {
      console.warn('No membership record found for member', memErr);
      membershipStatus = 'expired';
    } else {
      if (membershipData?.status === 'active') {
        if (membershipData.end_date) {
          const now = new Date();
          const expires = new Date(membershipData.end_date);
          membershipStatus = now <= expires ? 'active' : 'expired';
        } else {
          membershipStatus = 'active';
        }
      } else {
        membershipStatus = 'expired';
      }
    }
  }

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role as Role,
    name: userData.name,
    membershipStatus,
  } as AuthUser & { membershipStatus: 'active' | 'expired' | null };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<Role>(null);
  const [membershipStatus, setMembershipStatus] = useState<'active' | 'expired' | null>(null);

  const refreshUser = async (supabaseUser?: SupabaseUser) => {
    try {
      if (!supabaseUser) {
        setUser(null);
        setRole(null);
        setMembershipStatus(null);
        return;
      }
      const profile = await fetchUserProfile(supabaseUser);
      setUser({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await refreshUser(newSession.user);
      } else {
        setUser(null);
        setRole(null);
        setMembershipStatus(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        refreshUser(existingSession.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      await logMemberActivity("AUTH_LOGIN_FAILED", { email });
      setLoading(false);
      throw error;
    }
    // Ensure the Supabase auth cookie is set for SSR middleware
    if (data.session) {
      try {
        await supabase.auth.setSession(data.session);
        // Force retrieval to ensure cookie sync before UI redirects
        await supabase.auth.getSession();
      } catch (sessErr) {
        console.error('Failed to set Supabase session cookie', sessErr);
      }
    }
    try {
      await refreshUser(data.user);
      await logMemberActivity("AUTH_LOGIN");
    } catch (e: any) {
      await logMemberActivity("AUTH_LOGIN_FAILED", { email, reason: e.message || "refresh_failed" });
      console.error('Login refreshUser failed', e);
      // surface a friendly error for missing profile
      if (e.message?.includes('no matching public.users')) {
        throw new Error('Your account is not linked to a user profile. Please contact support.');
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await logMemberActivity("AUTH_LOGOUT");
    const { error } = await supabase.auth.signOut();
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

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
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
        logout,
        forgotPassword,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
