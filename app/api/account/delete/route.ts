import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteUserData } from '@/lib/storage';
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 }); const body = await request.json().catch(() => ({})); if (body.confirmation !== 'SUPPRIMER') return NextResponse.json({ error: 'Confirmation requise.' }, { status: 400 }); deleteUserData(user.id); const response = NextResponse.json({ ok: true }); response.cookies.delete('fixmy_demo_session'); return response; }
