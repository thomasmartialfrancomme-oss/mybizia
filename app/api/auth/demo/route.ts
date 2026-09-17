import { NextResponse } from 'next/server';
import { z } from 'zod';
import { upsertUser } from '@/lib/storage';
const schema = z.object({ email: z.string().email().max(200), name: z.string().trim().min(2).max(80).optional() });
export async function POST(request: Request) { try { const data = schema.parse(await request.json()); const id = `demo-${Buffer.from(data.email).toString('base64url').slice(0, 18)}`; upsertUser({ id, email: data.email, name: data.name || data.email.split('@')[0], role: 'USER', createdAt: new Date().toISOString() }); const response = NextResponse.json({ ok: true }); response.cookies.set('fixmy_demo_session', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' }); return response; } catch { return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 }); } }
