import { NextResponse } from 'next/server';
import { getReport } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';
import { getAIProvider, isAIConfigured } from '@/lib/ai/provider';
export async function POST(_: Request, { params }: { params: { id: string } }) { const report = getReport(params.id); const user = await getCurrentUser(); if (!report || (report.id !== 'demo' && report.userId !== user?.id)) return NextResponse.json({ error: 'Rapport introuvable.' }, { status: 404 }); const recommendations = await getAIProvider().generateRecommendations(report.results, report.summary); return NextResponse.json({ configured: isAIConfigured(), recommendations }); }
