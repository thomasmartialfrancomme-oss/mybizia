import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getReports, getSubscription, getWebsites } from '@/lib/storage';
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 }); return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), profile: user, websites: getWebsites(user.id), reports: getReports(user.id), subscription: getSubscription(user.id) }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="fixmybusiness-export.json"' } }); }
