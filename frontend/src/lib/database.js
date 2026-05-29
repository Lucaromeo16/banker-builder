import { supabase } from './supabase';

export function getSupabaseClient() {
  return supabase;
}

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

export async function getCurrentUser() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  return data?.user ?? null;
}

export async function selectCurrentUserRows(tableName, columns = '*') {
  const client = requireSupabaseClient();
  const user = await getCurrentUser();

  if (!user) return { data: [], error: null };

  return client.from(tableName).select(columns).eq('user_id', user.id);
}

export async function insertCurrentUserRow(tableName, values) {
  const client = requireSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('A signed-in user is required to insert user-owned records.');
  }

  return client.from(tableName).insert({ ...values, user_id: user.id }).select().single();
}

