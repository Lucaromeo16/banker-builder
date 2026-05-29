import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: false,
  isAuthReady: true,
  isSupabaseConfigured: false,
  supabase: null
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setIsAuthReady(true);
      return undefined;
    }

    let isMounted = true;

    const loadSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error && import.meta.env.DEV) {
        console.warn('Unable to load Supabase auth session.', error.message);
      }

      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
      setIsAuthReady(true);
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setIsAuthReady(true);
    });

    loadSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthReady,
      isSupabaseConfigured,
      supabase
    }),
    [isAuthReady, loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

