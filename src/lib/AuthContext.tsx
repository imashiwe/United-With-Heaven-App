import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { saveProfile } from '../utils/session';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  authLoading: true,
  refreshAdmin: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) checkAdmin(user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) checkAdmin(u.id);
      else { setIsAdmin(false); setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, display_name, avatar_emoji')
      .eq('user_id', userId)
      .maybeSingle();

    setIsAdmin(data?.is_admin ?? false);

    // Restore local profile from account if available
    if (data?.display_name) {
      saveProfile({ displayName: data.display_name, avatarEmoji: data.avatar_emoji ?? '🙏' });
    }

    setAuthLoading(false);
  }

  async function refreshAdmin() {
    if (!user) return;
    await checkAdmin(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, authLoading, refreshAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
