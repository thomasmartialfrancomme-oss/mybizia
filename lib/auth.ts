import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { StoredUser } from '@/lib/database/types';
import { getUser } from '@/lib/storage';

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const cookieStore = cookies();
  return createServerClient(url, key, { cookies: { getAll() { return cookieStore.getAll(); }, setAll(values: Array<{ name: string; value: string; options?: any }>) { try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} } } });
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) return { id: data.user.id, email: data.user.email ?? '', name: (data.user.user_metadata?.name as string) || data.user.email?.split('@')[0] || 'Utilisateur', role: data.user.app_metadata?.role === 'ADMIN' ? 'ADMIN' : 'USER', createdAt: data.user.created_at };
  }
  const demoSession = cookies().get('fixmy_demo_session')?.value;
  return demoSession ? getUser(demoSession) ?? null : null;
}

export async function requireUser() { const user = await getCurrentUser(); if (!user) throw new Error('AUTH_REQUIRED'); return user; }
