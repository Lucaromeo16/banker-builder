import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: false,
  profileLoading: false,
  authError: null,
  isAuthReady: true,
  isSupabaseConfigured: false,
  supabase: null,
  refreshProfile: async () => null,
  updateProfile: () => {},
  signOut: async () => {}
});

function getFullNameFromUser(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || null;
}

function isUserEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

async function loadOrCreateProfile(user) {
  if (!supabase || !user) return null;

  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existingProfile) return existingProfile;

  const { data: createdProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      full_name: getFullNameFromUser(user),
      school: null,
      graduation_year: null,
      major: null,
      target_role: null
    })
    .select('*')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: racedProfile, error: racedSelectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (racedSelectError) throw racedSelectError;
      if (racedProfile) return racedProfile;
    }

    throw insertError;
  }

  return createdProfile;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setIsAuthReady(true);
      return undefined;
    }

    let isMounted = true;

    const applySession = async (nextSession) => {
      if (!isMounted) return;

      const nextUser = nextSession?.user ?? null;

      if (nextUser && !isUserEmailConfirmed(nextUser)) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        setAuthError('Please confirm your email before logging in.');
        setLoading(false);
        setIsAuthReady(true);
        await supabase.auth.signOut();
        if (isMounted) {
          setAuthError('Please confirm your email before logging in.');
        }
        return;
      }

      setSession(nextSession);
      setUser(nextUser);
      setAuthError(null);

      if (!nextUser) {
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
        setIsAuthReady(true);
        return;
      }

      setProfileLoading(true);

      try {
        const nextProfile = await loadOrCreateProfile(nextUser);
        if (!isMounted) return;
        setProfile(nextProfile);
      } catch (error) {
        if (!isMounted) return;
        setProfile(null);
        setAuthError(error.message || 'Unable to load your Banker Builder profile.');
        if (import.meta.env.DEV) {
          console.warn('Unable to load or create Supabase profile.', error);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
          setLoading(false);
          setIsAuthReady(true);
        }
      }
    };

    const loadSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error && import.meta.env.DEV) {
        console.warn('Unable to load Supabase auth session.', error.message);
      }

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        setIsAuthReady(true);
        return;
      }

      await applySession(data?.session ?? null);
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    loadSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return { error: null };

    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      setLoading(false);
      return { error };
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
    setLoading(false);
    return { error: null };
  };

  const refreshProfile = async () => {
    if (!user) return null;

    setProfileLoading(true);

    try {
      const nextProfile = await loadOrCreateProfile(user);
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      setAuthError(error.message || 'Unable to refresh your Banker Builder profile.');
      if (import.meta.env.DEV) {
        console.warn('Unable to refresh Supabase profile.', error);
      }
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = (nextProfile) => {
    setProfile((current) => ({
      ...(current || {}),
      ...(nextProfile || {})
    }));
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      authError,
      isAuthReady,
      isSupabaseConfigured,
      supabase,
      refreshProfile,
      updateProfile,
      signOut
    }),
    [authError, isAuthReady, loading, profile, profileLoading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
