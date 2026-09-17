import { describe, expect, it } from 'vitest';
import { assertCanAnalyze, quotaFor, quotaUsage } from '@/lib/quotas';

describe('central quotas', () => {
  it('returns the documented free defaults', () => { expect(quotaFor('FREE')).toMatchObject({ maxWebsites: 1, maxAnalyses: 3, maxPages: 1, ai: false }); });
  it('counts only the current month', () => { const now = new Date('2026-09-16T00:00:00Z'); expect(quotaUsage([{ userId: 'u', createdAt: '2026-09-01T00:00:00Z' }, { userId: 'u', createdAt: '2026-08-31T00:00:00Z' }, { userId: 'b', createdAt: '2026-09-02T00:00:00Z' }], 'u', now)).toBe(1); });
  it('blocks analysis only at the limit', () => { expect(() => assertCanAnalyze(2, 'FREE')).not.toThrow(); expect(() => assertCanAnalyze(3, 'FREE')).toThrow(/QUOTA_EXCEEDED/); });
});
