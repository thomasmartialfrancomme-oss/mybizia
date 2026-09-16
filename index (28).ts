import type { Plan } from '@/lib/database/types';

export type Quota = { maxWebsites: number; maxAnalyses: number; maxPages: number; ai: boolean; monitoring: boolean };
const numberEnv = (name: string, fallback: number) => Number(process.env[name] || fallback);
export function quotaFor(plan: Plan): Quota {
  if (plan === 'BUSINESS') return { maxWebsites: numberEnv('BUSINESS_MAX_WEBSITES', 50), maxAnalyses: numberEnv('BUSINESS_MAX_ANALYSES', 200), maxPages: numberEnv('BUSINESS_MAX_PAGES', 25), ai: true, monitoring: true };
  if (plan === 'PRO') return { maxWebsites: numberEnv('PRO_MAX_WEBSITES', 10), maxAnalyses: numberEnv('PRO_MAX_ANALYSES', 50), maxPages: numberEnv('PRO_MAX_PAGES', 10), ai: true, monitoring: true };
  return { maxWebsites: numberEnv('FREE_MAX_WEBSITES', 1), maxAnalyses: numberEnv('FREE_MAX_ANALYSES', 3), maxPages: numberEnv('FREE_MAX_PAGES', 1), ai: false, monitoring: false };
}
export function monthKey(date = new Date()) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; }
export function quotaUsage(reports: { userId: string; createdAt: string }[], userId: string, now = new Date()) { const key = monthKey(now); return reports.filter((r) => r.userId === userId && monthKey(new Date(r.createdAt)) === key).length; }
export function assertCanAnalyze(usage: number, plan: Plan) { const quota = quotaFor(plan); if (usage >= quota.maxAnalyses) throw new Error(`QUOTA_EXCEEDED:${quota.maxAnalyses}`); }
