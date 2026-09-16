import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth';
export async function GET(request: Request) { const supabase = await getSupabaseServerClient(); const url = new URL(request.url); const code = url.searchParams.get('code'); if (supabase && code) await supabase.auth.exchangeCodeForSession(code); return NextResponse.redirect(new URL('/dashboard', request.url)); }
