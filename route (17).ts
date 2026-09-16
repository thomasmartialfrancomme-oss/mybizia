import { NextResponse } from 'next/server';
import { getReport } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';
export async function GET(_: Request, { params }: { params: { id: string } }) { const report = getReport(params.id); const user = await getCurrentUser(); if (!report || (report.id !== 'demo' && report.userId !== user?.id)) return NextResponse.json({ error: 'Rapport introuvable.' }, { status: 404 }); return NextResponse.json({ report }); }
