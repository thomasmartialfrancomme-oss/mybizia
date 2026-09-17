import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeWebsite } from '@/lib/analyzer';
import { normalizeUrl, UrlValidationError } from '@/lib/analyzer/url';
import { rateLimit } from '@/lib/security/rate-limit';
import { getCurrentUser } from '@/lib/auth';
import { getReports, getSubscription, saveReport } from '@/lib/storage';
import { assertCanAnalyze, quotaFor, quotaUsage } from '@/lib/quotas';

export const runtime = 'nodejs';
export const maxDuration = 30;
const schema = z.object({ url: z.string().min(1).max(2048), pages: z.coerce.number().int().min(1).max(10).default(1) });

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const limit = rateLimit(`analyze:${ip}`, 8, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une minute.' }, { status: 429 });
  try {
    const body = schema.parse(await request.json());
    const safeUrl = normalizeUrl(body.url);
    const user = await getCurrentUser();
    const userId = user?.id || 'demo-user';
    const subscription = getSubscription(userId);
    const quota = quotaFor(subscription.plan);
    const reports = getReports(userId);
    assertCanAnalyze(quotaUsage(reports, userId), subscription.plan);
    if (body.pages > quota.maxPages) return NextResponse.json({ error: `Votre plan autorise ${quota.maxPages} page(s) par analyse.` }, { status: 403 });
    const report = await analyzeWebsite(safeUrl.toString(), body.pages);
    saveReport({ ...report, userId });
    return NextResponse.json({ id: report.id, report });
  } catch (error) {
    if (error instanceof UrlValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Les paramètres de l’analyse sont invalides.' }, { status: 400 });
    if (error instanceof Error && error.message.startsWith('QUOTA_EXCEEDED:')) return NextResponse.json({ error: `Votre quota mensuel est atteint (${error.message.split(':')[1]} analyses).` }, { status: 429 });
    console.error(JSON.stringify({ event: 'analysis_failed', message: error instanceof Error ? error.message : 'unknown' }));
    return NextResponse.json({ error: 'L’analyse n’a pas pu être terminée. Vérifiez que la page est publique et réessayez.' }, { status: 502 });
  }
}
